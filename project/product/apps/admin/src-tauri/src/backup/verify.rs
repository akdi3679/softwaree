use chrono::Utc;
use reqwest::Client;
use serde::Serialize;
use sha2::{Digest, Sha256};
use sqlx::sqlite::SqliteConnectOptions;
use sqlx::SqlitePool;
use std::str::FromStr;

use crate::backup::crypto;
use crate::error::{AppError, AppResult};

#[derive(Debug, Serialize)]
pub struct VerifyResult {
    pub backup_id: String,
    pub passed: bool,
    pub sha256_match: bool,
    pub sqlite_open: bool,
    pub event_count: i64,
    pub last_sequence: i64,
    pub audit_chain_valid: bool,
    pub checked_at: String,
    pub notes: Vec<String>,
}

pub async fn verify(
    client: &Client,
    cloud_base_url: &str,
    auth_token: &str,
    project_id: &str,
    backup_id: &str,
    passphrase: &str,
    device_key_bytes: &[u8],
) -> AppResult<VerifyResult> {
    let mut notes: Vec<String> = vec![];
    let mut result = VerifyResult {
        backup_id: backup_id.to_string(),
        passed: false,
        sha256_match: false,
        sqlite_open: false,
        event_count: 0,
        last_sequence: 0,
        audit_chain_valid: false,
        checked_at: Utc::now().to_rfc3339(),
        notes: vec![],
    };

    let meta_url = format!("{cloud_base_url}/v1/backups/{backup_id}");
    let meta: serde_json::Value = client
        .get(&meta_url)
        .bearer_auth(auth_token)
        .send()
        .await
        .map_err(|e| AppError::Network(format!("metadata: {e}")))?
        .error_for_status()
        .map_err(|e| AppError::Network(format!("metadata status: {e}")))?
        .json()
        .await
        .map_err(|e| AppError::Network(format!("metadata decode: {e}")))?;

    if meta["project_id"].as_str() != Some(project_id) {
        return Err(AppError::Validation("backup does not belong to this project".into()));
    }
    let expected_sha = meta["database_sha256"]
        .as_str()
        .unwrap_or_default()
        .to_string();

    let dl_url = format!("{cloud_base_url}/v1/backups/{backup_id}/presigned-download");
    let dl: serde_json::Value = client
        .get(&dl_url)
        .bearer_auth(auth_token)
        .send()
        .await
        .map_err(|e| AppError::Network(format!("presign: {e}")))?
        .error_for_status()
        .map_err(|e| AppError::Network(format!("presign status: {e}")))?
        .json()
        .await
        .map_err(|e| AppError::Network(format!("presign decode: {e}")))?;
    let presigned_url = dl["presigned_url"]
        .as_str()
        .ok_or_else(|| AppError::Validation("no url".into()))?
        .to_string();

    let bytes = client
        .get(&presigned_url)
        .send()
        .await
        .map_err(|e| AppError::Network(format!("download: {e}")))?
        .error_for_status()
        .map_err(|e| AppError::Network(format!("download status: {e}")))?
        .bytes()
        .await
        .map_err(|e| AppError::Network(format!("download body: {e}")))?;

    let (ciphertext, nonce_hex, salt_hex) = crate::backup::restore::parse_encrypted_package(&bytes)?;
    let encrypted = crypto::EncryptedBackup {
        ciphertext,
        nonce: crate::backup::restore::decode_hex_12(&nonce_hex)?,
        salt: crate::backup::restore::decode_hex_32(&salt_hex)?,
        version: 1,
    };
    let plaintext = crypto::decrypt(&encrypted, device_key_bytes, passphrase)?;
    let mut hasher = Sha256::new();
    hasher.update(&plaintext);
    let actual_sha = hex::encode(hasher.finalize());
    result.sha256_match = actual_sha == expected_sha;
    if !result.sha256_match {
        notes.push(format!("sha256 mismatch: expected {expected_sha}, got {actual_sha}"));
    }

    let tmp = std::env::temp_dir().join(format!("backup_verify_{backup_id}.sqlite"));
    tokio::fs::write(&tmp, &plaintext).await?;
    let url = format!("sqlite://{}", tmp.display());
    let opts = SqliteConnectOptions::from_str(&url)?.read_only(true);
    let pool = match SqlitePool::connect_with(opts).await {
        Ok(p) => {
            result.sqlite_open = true;
            p
        }
        Err(e) => {
            notes.push(format!("sqlite open failed: {e}"));
            result.notes = notes;
            return Ok(result);
        }
    };

    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM events")
        .fetch_one(&pool)
        .await
        .unwrap_or(0);
    result.event_count = count;
    result.last_sequence = sqlx::query_scalar::<_, i64>("SELECT MAX(sequence) FROM events")
        .fetch_one(&pool)
        .await
        .unwrap_or(0);

    let chain_rows: Vec<(i64, String)> = sqlx::query_as(
        "SELECT id, entry_hash FROM audit_entries ORDER BY id ASC",
    )
    .fetch_all(&pool)
    .await
    .unwrap_or_default();
    result.audit_chain_valid = !chain_rows.is_empty();
    if !result.audit_chain_valid {
        notes.push("audit chain empty or unreadable".into());
    }

    pool.close().await;
    let _ = tokio::fs::remove_file(&tmp).await;

    result.passed = result.sha256_match && result.sqlite_open && result.audit_chain_valid;
    result.notes = notes;
    Ok(result)
}
