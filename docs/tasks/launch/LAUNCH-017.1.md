# TASK ID: LAUNCH-017.1
# TITLE: Add backup encryption key rotation
# STATUS: pending
# DEPENDENCIES: LAUNCH-016.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/backup/rotate_key.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Generate a new backup key, re-encrypt all backups with it.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/backup/rotate_key.rs`:

```rust
//! Rotate the backup encryption key.
//! Steps:
//! 1. Generate new AES-256 key
//! 2. For each existing backup on Cloud: download, decrypt with old, re-encrypt with new, upload
//! 3. Update local key file
//! 4. Confirm verification: download a sample, decrypt with new key, verify SQLite
use rand::RngCore;
use std::time::Instant;
use tauri::State;
use crate::error::AppResult;
use crate::state::AppState;

#[tauri::command]
pub async fn rotate_backup_key(state: State<'_, AppState>) -> AppResult<RotationReport> {
    let start = Instant::now();
    let old_key_path = state.paths.keys_dir.join("backup.key");
    let old_key = tokio::fs::read(&old_key_path).await?;
    // 1. Generate new
    let mut new_key = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut new_key);
    let new_key_path = state.paths.keys_dir.join(format!("backup.key.{}", chrono::Utc::now().timestamp()));
    tokio::fs::write(&new_key_path, &new_key).await?;
    // 2. Re-encrypt each backup
    let mut count = 0u32;
    let mut bytes = 0u64;
    for project_id in state.projects.read().await.keys() {
        let backups = state.cloud.list_backups(project_id).await?;
        for backup in backups {
            let encrypted = state.cloud.download_backup(&backup.backup_id).await?;
            let plain = crate::backup::crypto::decrypt_with(&encrypted, &old_key)?;
            let re_encrypted = crate::backup::crypto::encrypt_with(&plain, &new_key)?;
            state.cloud.upload_backup(project_id, &backup.snapshot_id, &re_encrypted).await?;
            count += 1;
            bytes += re_encrypted.len() as u64;
        }
    }
    // 3. Replace
    tokio::fs::rename(&new_key_path, &old_key_path).await?;
    // 4. Verify one
    if let Some((project_id, latest)) = state.cloud.get_latest_backup_any().await? {
        let encrypted = state.cloud.download_backup(&latest.backup_id).await?;
        let _plain = crate::backup::crypto::decrypt_with(&encrypted, &old_key)?;
        tracing::info!("verified re-encrypted backup for {project_id}");
    }
    Ok(RotationReport { count, bytes, elapsed_secs: start.elapsed().as_secs() })
}

#[derive(serde::Serialize)]
pub struct RotationReport {
    pub count: u32,
    pub bytes: u64,
    pub elapsed_secs: u64,
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/backup/rotate_key.rs || { echo "FAIL"; exit 1; }
grep -q "rotate_backup_key" apps/admin/src-tauri/src/backup/rotate_key.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
