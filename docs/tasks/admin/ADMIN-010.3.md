# TASK ID: ADMIN-010.3
# TITLE: Add backup upload to Cloud (S3-compatible / MinIO)
# STATUS: pending
# DEPENDENCIES: ADMIN-010.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/backup/upload.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Upload the encrypted backup to the Cloud (via MinIO/S3 API).

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/backup/upload.rs`:

```rust
use base64::Engine;
use base64::engine::general_purpose::STANDARD as B64;
use chrono::Utc;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::backup::crypto::EncryptedBackup;
use crate::backup::snapshot::BackupSnapshot;
use crate::error::{AppError, AppResult};

#[derive(Debug, Serialize, Deserialize)]
pub struct UploadResponse {
    pub backup_id: String,
    pub object_key: String,
    pub uploaded_at: String,
}

/// Upload a backup to the Cloud.
/// 1. Register the backup with Cloud
/// 2. Get a presigned URL
/// 3. PUT the encrypted blob to the presigned URL
pub async fn upload(
    client: &Client,
    cloud_base_url: &str,
    auth_token: &str,
    project_id: &str,
    snapshot: &BackupSnapshot,
    encrypted: &EncryptedBackup,
) -> AppResult<UploadResponse> {
    // 1. Register
    let register_url = format!("{cloud_base_url}/v1/backups");
    let register_body = serde_json::json!({
        "projectId": project_id,
        "schemaVersion": snapshot.schema_version,
        "databaseSha256": snapshot.database_sha256,
        "encryptedSizeBytes": encrypted.ciphertext.len(),
        "note": snapshot.note,
    });
    let register_response: RegisterResponse = client
        .post(&register_url)
        .bearer_auth(auth_token)
        .json(&register_body)
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;

    // 2. PUT the encrypted blob
    let put_response = client
        .put(&register_response.presigned_url)
        .header("content-type", "application/octet-stream")
        .body(encrypted.ciphertext.clone())
        .send()
        .await?
        .error_for_status()?;

    if !put_response.status().is_success() {
        return Err(AppError::Cloud(format!(
            "presigned PUT failed: HTTP {}",
            put_response.status()
        )));
    }

    Ok(UploadResponse {
        backup_id: register_response.backup_id,
        object_key: register_response.object_key,
        uploaded_at: Utc::now().to_rfc3339(),
    })
}

#[derive(Debug, Deserialize)]
struct RegisterResponse {
    backup_id: String,
    object_key: String,
    presigned_url: String,
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/backup/upload.rs || { echo "FAIL"; exit 1; }
grep -q "fn upload" apps/admin/src-tauri/src/backup/upload.rs || { echo "FAIL"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -3 || { echo "FAIL"; exit 1; }
echo "OK"
```
