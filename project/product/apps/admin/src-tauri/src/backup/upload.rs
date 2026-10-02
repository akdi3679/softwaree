use crate::backup::crypto::EncryptedBackup;
use crate::backup::snapshot::BackupSnapshot;
use crate::error::{AppError, AppResult};

pub async fn upload(
    client: &reqwest::Client,
    cloud_base_url: &str,
    auth_token: &str,
    project_id: &str,
    snapshot: &BackupSnapshot,
    encrypted: &EncryptedBackup,
) -> AppResult<String> {
    // If Cloud is not configured, keep the backup local-only and return a synthetic id.
    if cloud_base_url.is_empty() || auth_token.is_empty() {
        tracing::warn!("cloud not configured; backup kept local only");
        return Ok(format!("local-{}", snapshot.created_at));
    }

    let url = format!("{cloud_base_url}/v1/backups");
    let body = serde_json::json!({
        "project_id": project_id,
        "kind": "scheduled",
        "database_sha256": snapshot.database_sha256,
        "snapshot_taken_at": snapshot.created_at,
        "schema_version": snapshot.schema_version,
        "note": snapshot.note,
        "ciphertext_b64": base64_encode(&encrypted.ciphertext),
        "nonce_hex": hex::encode(encrypted.nonce),
        "salt_hex": hex::encode(encrypted.salt),
        "crypto_version": encrypted.version,
    });

    let resp = client
        .post(&url)
        .bearer_auth(auth_token)
        .json(&body)
        .send()
        .await
        .map_err(|e| AppError::Network(format!("backup upload: {e}")))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        return Err(AppError::Network(format!("backup upload failed: {status} {text}")));
    }

    let parsed: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| AppError::Network(format!("backup upload decode: {e}")))?;

    Ok(parsed
        .get("backup_id")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown")
        .to_string())
}

fn base64_encode(bytes: &[u8]) -> String {
    use base64::Engine as _;
    base64::engine::general_purpose::STANDARD.encode(bytes)
}
