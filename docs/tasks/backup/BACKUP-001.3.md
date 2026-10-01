# TASK ID: BACKUP-001.3
# TITLE: Add backup verification tool (sanity-check a backup)
# STATUS: pending
# DEPENDENCIES: BACKUP-001.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/backup/verify.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add a command to verify a backup without restoring it. Downloads, decrypts, opens, runs integrity check.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/backup/verify.rs`:

```rust
use base64::Engine;
use base64::engine::general_purpose::STANDARD as B64;
use chrono::Utc;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::sqlite::SqliteConnectOptions;
use sqlx::SqlitePool;
use std::path::Path;
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
    let mut notes = vec![];
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

    // 1. Get metadata
    let meta_url = format!("{cloud_base_url}/v1/backups/{backup_id}");
    let meta: serde_json::Value = client.get(&meta_url)
        .bearer_auth(auth_token)
        .send().await?
        .error_for_status()?
        .json().await?;
    if meta["project_id"].as_str() != Some(project_id) {
        return Err(AppError::Validation("backup does not belong to this project".into()));
    }
    let expected_sha = meta["database_sha256"].as_str().unwrap_or_default().to_string();

    // 2. Get presigned URL
    let dl_url = format!("{cloud_base_url}/v1/backups/{backup_id}/presigned-download");
    let dl: serde_json::Value = client.get(&dl_url)
        .bearer_auth(auth_token)
        .send().await?
        .error_for_status()?
        .json().await?;
    let presigned_url = dl["presigned_url"].as_str().ok_or_else(|| AppError::Validation("no url".into()))?.to_string();

    // 3. Download + decrypt
    let bytes = client.get(&presigned_url).send().await?.error_for_status()?.bytes().await?;
    let (ciphertext, nonce_b64, salt_b64) = crate::backup::restore::parse_encrypted_package(&bytes)?;
    let encrypted = crypto::EncryptedBackup {
        ciphertext,
        nonce: decode_hex_12(&nonce_b64)?,
        salt: decode_hex_32(&salt_b64)?,
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

    // 4. Open as SQLite (to a temp file)
    let tmp = std::env::temp_dir().join(format!("backup_verify_{}.sqlite", backup_id));
    tokio::fs::write(&tmp, &plaintext).await?;
    let url = format!("sqlite://{}", tmp.display());
    let opts = SqliteConnectOptions::from_str(&url)?.read_only(true);
    let pool = match SqlitePool::connect_with(opts).await {
        Ok(p) => { result.sqlite_open = true; p }
        Err(e) => {
            notes.push(format!("sqlite open failed: {e}"));
            result.notes = notes;
            return Ok(result);
        }
    };

    // 5. Count events
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM events").fetch_one(&pool).await.unwrap_or(0);
    result.event_count = count;
    result.last_sequence = sqlx::query_scalar::<_, i64>("SELECT MAX(sequence) FROM events").fetch_one(&pool).await.unwrap_or(0);

    // 6. Verify audit chain
    let valid = sqlx::query_as::<_, (i64,)>(
        "WITH RECURSIVE chain(id, prev_hash, valid) AS (
            SELECT id, prev_hash, (prev_hash = '0000000000000000000000000000000000000000000000000000000000000000') FROM audit_entries ORDER BY id ASC LIMIT 1
            UNION ALL
            SELECT a.id, a.prev_hash, (a.prev_hash = c.entry_hash)
            FROM audit_entries a JOIN chain c ON a.id > c.id
        )
        SELECT COUNT(*) FROM chain WHERE valid = 1"
    )
    .fetch_one(&pool).await.unwrap_or((0,));
    result.audit_chain_valid = valid.0 > 0;
    if !result.audit_chain_valid {
        notes.push("audit chain not valid".into());
    }

    pool.close().await;
    let _ = tokio::fs::remove_file(&tmp).await;

    result.passed = result.sha256_match && result.sqlite_open && result.audit_chain_valid;
    result.notes = notes;
    Ok(result)
}

fn decode_hex_12(s: &str) -> AppResult<[u8; 12]> {
    let bytes = hex::decode(s).map_err(|e| AppError::Crypto(format!("hex: {e}")))?;
    bytes.try_into().map_err(|_| AppError::Crypto("expected 12 bytes".into()))
}
fn decode_hex_32(s: &str) -> AppResult<[u8; 32]> {
    let bytes = hex::decode(s).map_err(|e| AppError::Crypto(format!("hex: {e}")))?;
    bytes.try_into().map_err(|_| AppError::Crypto("expected 32 bytes".into()))
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/backup/verify.rs || { echo "FAIL"; exit 1; }
grep -q "fn verify" apps/admin/src-tauri/src/backup/verify.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
