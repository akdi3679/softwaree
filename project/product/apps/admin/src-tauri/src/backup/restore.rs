use reqwest::Client;
use serde::Deserialize;
use sha2::{Digest, Sha256};
use std::path::Path;

use crate::backup::crypto;
use crate::error::{AppError, AppResult};

#[derive(Debug, Deserialize)]
struct BackupMetadata {
    id: String,
    project_id: String,
    database_sha256: String,
    schema_version: i32,
    encrypted_size_bytes: i64,
    created_at: String,
    object_key: String,
}

#[derive(Debug, Deserialize)]
struct DownloadResponse {
    presigned_url: String,
}

pub async fn restore(
    client: &Client,
    cloud_base_url: &str,
    auth_token: &str,
    project_id: &str,
    backup_id: &str,
    passphrase: &str,
    device_key_bytes: &[u8],
    live_db_path: &Path,
) -> AppResult<()> {
    let meta_url = format!("{cloud_base_url}/v1/backups/{backup_id}");
    let meta: BackupMetadata = client
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

    if meta.project_id != project_id {
        return Err(AppError::Validation("backup does not belong to this project".into()));
    }

    let dl_url = format!("{cloud_base_url}/v1/backups/{backup_id}/presigned-download");
    let dl: DownloadResponse = client
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

    let bytes = client
        .get(&dl.presigned_url)
        .send()
        .await
        .map_err(|e| AppError::Network(format!("download: {e}")))?
        .error_for_status()
        .map_err(|e| AppError::Network(format!("download status: {e}")))?
        .bytes()
        .await
        .map_err(|e| AppError::Network(format!("download body: {e}")))?;

    let (ciphertext_bytes, nonce_hex, salt_hex) = parse_encrypted_package(&bytes)?;
    let encrypted = crypto::EncryptedBackup {
        ciphertext: ciphertext_bytes,
        nonce: decode_hex_12(&nonce_hex)?,
        salt: decode_hex_32(&salt_hex)?,
        version: 1,
    };
    let plaintext = crypto::decrypt(&encrypted, device_key_bytes, passphrase)?;

    let mut hasher = Sha256::new();
    hasher.update(&plaintext);
    let actual_sha256 = hex::encode(hasher.finalize());
    if actual_sha256 != meta.database_sha256 {
        return Err(AppError::Validation(format!(
            "SHA-256 mismatch: expected {}, got {}",
            meta.database_sha256, actual_sha256
        )));
    }

    let restoring_path = live_db_path.with_extension("sqlite.restoring");
    tokio::fs::write(&restoring_path, &plaintext).await?;

    let live = live_db_path.to_path_buf();
    tokio::spawn(async move {
        tokio::time::sleep(std::time::Duration::from_secs(3)).await;
        if let Err(e) = tokio::fs::rename(&restoring_path, &live).await {
            tracing::error!(error = %e, "restore: rename failed");
        }
    });

    Ok(())
}

pub fn decode_hex_12(s: &str) -> AppResult<[u8; 12]> {
    let bytes = hex::decode(s).map_err(|e| AppError::Crypto(format!("hex: {e}")))?;
    bytes
        .try_into()
        .map_err(|_| AppError::Crypto("expected 12 bytes".into()))
}

pub fn decode_hex_32(s: &str) -> AppResult<[u8; 32]> {
    let bytes = hex::decode(s).map_err(|e| AppError::Crypto(format!("hex: {e}")))?;
    bytes
        .try_into()
        .map_err(|_| AppError::Crypto("expected 32 bytes".into()))
}

pub fn parse_encrypted_package(buf: &[u8]) -> AppResult<(Vec<u8>, String, String)> {
    if buf.len() < 4 + 24 + 64 {
        return Err(AppError::Crypto("package too small".into()));
    }
    if &buf[0..4] != b"BKP1" {
        return Err(AppError::Crypto("bad magic".into()));
    }
    let nonce = String::from_utf8(buf[4..28].to_vec())
        .map_err(|_| AppError::Crypto("bad nonce".into()))?;
    let salt = String::from_utf8(buf[28..92].to_vec())
        .map_err(|_| AppError::Crypto("bad salt".into()))?;
    Ok((buf[92..].to_vec(), nonce, salt))
}
