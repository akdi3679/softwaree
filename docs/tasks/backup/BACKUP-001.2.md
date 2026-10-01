# TASK ID: BACKUP-001.2
# TITLE: Add backup restore command
# STATUS: pending
# DEPENDENCIES: BACKUP-001.1
# ALLOWED FILES: product/apps/admin/src-tauri/src/backup/restore.rs, product/apps/admin/src-tauri/src/commands/backup.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Restore from a backup: download, decrypt, replace local DB (with safety).

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/backup/restore.rs`:

```rust
use base64::Engine;
use base64::engine::general_purpose::STANDARD as B64;
use chrono::Utc;
use reqwest::Client;
use serde::Deserialize;
use sha2::{Digest, Sha256};
use std::path::Path;

use crate::backup::crypto;
use crate::error::{AppError, AppResult};

#[derive(Debug, Deserialize)]
struct EncryptedManifest {
    ciphertext_b64: String,
    nonce: String,
    salt: String,
    version: u8,
}

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

/// Restore a backup.
/// 1. Get metadata + presigned download URL from Cloud
/// 2. Download ciphertext
/// 3. Decrypt with device key + passphrase
/// 4. Verify SHA-256 matches metadata
/// 5. Write to a NEW file (do not overwrite the live DB)
/// 6. Atomically swap after a 3-second delay (so any open connection is closed)
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
    // 1. Get metadata
    let meta_url = format!("{cloud_base_url}/v1/backups/{backup_id}");
    let meta: BackupMetadata = client.get(&meta_url)
        .bearer_auth(auth_token)
        .send().await?
        .error_for_status()?
        .json().await?;
    if meta.project_id != project_id {
        return Err(AppError::Validation("backup does not belong to this project".into()));
    }

    // 2. Get presigned download URL
    let dl_url = format!("{cloud_base_url}/v1/backups/{backup_id}/presigned-download");
    let dl_response: DownloadResponse = client.get(&dl_url)
        .bearer_auth(auth_token)
        .send().await?
        .error_for_status()?
        .json().await?;

    // 3. Download ciphertext
    let ciphertext = client.get(&dl_response.presigned_url).send().await?
        .error_for_status()?
        .bytes().await?;

    // 4. Decode nonce and salt from header metadata
    let (ciphertext_bytes, nonce_b64, salt_b64) = parse_encrypted_package(&ciphertext)?;

    let encrypted = crypto::EncryptedBackup {
        ciphertext: ciphertext_bytes,
        nonce: decode_hex_12(&nonce_b64)?,
        salt: decode_hex_32(&salt_b64)?,
        version: 1,
    };
    let plaintext = crypto::decrypt(&encrypted, device_key_bytes, passphrase)?;

    // 5. Verify SHA-256
    let mut hasher = Sha256::new();
    hasher.update(&plaintext);
    let actual_sha256 = hex::encode(hasher.finalize());
    if actual_sha256 != meta.database_sha256 {
        return Err(AppError::Validation(format!(
            "SHA-256 mismatch: expected {}, got {}", meta.database_sha256, actual_sha256
        )));
    }

    // 6. Write to a new file
    let backup_path = live_db_path.with_extension("sqlite.restoring");
    tokio::fs::write(&backup_path, &plaintext).await?;

    // 7. Schedule atomic swap after 3 seconds
    let live = live_db_path.to_path_buf();
    tokio::spawn(async move {
        sleep_seconds(3).await;
        // Best-effort: rename the restoring file
        if let Err(e) = tokio::fs::rename(&backup_path, &live).await {
            tracing::error!(error = %e, "rename failed");
        }
    });

    Ok(())
}

#[derive(Debug, Deserialize)]
struct DownloadResponse {
    presigned_url: String,
}

async fn sleep_seconds(s: u64) { tokio::time::sleep(std::time::Duration::from_secs(s)).await; }

fn decode_hex_12(s: &str) -> AppResult<[u8; 12]> {
    let bytes = hex::decode(s).map_err(|e| AppError::Crypto(format!("hex: {e}")))?;
    bytes.try_into().map_err(|_| AppError::Crypto("expected 12 bytes".into()))
}

fn decode_hex_32(s: &str) -> AppResult<[u8; 32]> {
    let bytes = hex::decode(s).map_err(|e| AppError::Crypto(format!("hex: {e}")))?;
    bytes.try_into().map_err(|_| AppError::Crypto("expected 32 bytes".into()))
}

fn parse_encrypted_package(buf: &[u8]) -> AppResult<(Vec<u8>, String, String)> {
    // Format: [magic 4 bytes "BKP1"] [nonce hex 24] [salt hex 64] [ciphertext...]
    if buf.len() < 4 + 24 + 64 {
        return Err(AppError::Crypto("package too small".into()));
    }
    if &buf[0..4] != b"BKP1" {
        return Err(AppError::Crypto("bad magic".into()));
    }
    let nonce = String::from_utf8(buf[4..28].to_vec()).map_err(|_| AppError::Crypto("bad nonce".into()))?;
    let salt = String::from_utf8(buf[28..92].to_vec()).map_err(|_| AppError::Crypto("bad salt".into()))?;
    Ok((buf[92..].to_vec(), nonce, salt))
}
```

Update `product/apps/admin/src-tauri/src/commands/backup.rs`:

```rust
#[tauri::command]
pub async fn restore_backup(
    state: State<'_, AppState>,
    project_id: String,
    backup_id: String,
    passphrase: String,
) -> AppResult<()> {
    let projects = state.projects.read().await;
    let handle = projects.get(&project_id).ok_or_else(|| AppError::NotFound("project not open".into()))?;
    let path: String = sqlx::query_scalar("SELECT file_path FROM projects WHERE id = ?")
        .bind(&project_id)
        .fetch_one(&handle.db).await?;
    let device_key = state.device.signing_key();
    crate::backup::restore::restore(
        &state.http_client,
        &state.cloud_base_url,
        &state.cloud_token.lock().await,
        &project_id,
        &backup_id,
        &passphrase,
        &device_key,
        std::path::Path::new(&path),
    ).await
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/backup/restore.rs || { echo "FAIL"; exit 1; }
grep -q "fn restore" apps/admin/src-tauri/src/backup/restore.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
