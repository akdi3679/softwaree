# TASK ID: ADMIN-080.1
# TITLE: Add Admin: per-project backup verification (every Sunday)
# STATUS: pending
# DEPENDENCIES: ADMIN-079.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/backup/verify_weekly.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Every Sunday: pick a random backup, download from Cloud, verify it can be restored.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/backup/verify_weekly.rs`:

```rust
use std::time::Duration;
use tokio::time::interval;
use crate::state::AppState;

pub fn spawn(state: std::sync::Arc<AppState>) {
    tokio::spawn(async move {
        let mut ticker = interval(Duration::from_secs(7 * 24 * 60 * 60)); // weekly
        loop {
            ticker.tick().await;
            for (project_id, _handle) in state.projects.read().await.iter() {
                if let Err(e) = verify_one(state.clone(), project_id.clone()).await {
                    tracing::error!(target: "backup_verify", "{project_id} verify failed: {e}");
                }
            }
        }
    });
}

async fn verify_one(state: std::sync::Arc<AppState>, project_id: String) -> Result<(), String> {
    // 1. Pick the most recent backup
    let backup = state.cloud.get_latest_backup(&project_id).await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "no backups".to_string())?;
    // 2. Download
    let bytes = state.cloud.download_backup(&backup.backup_id).await
        .map_err(|e| e.to_string())?;
    // 3. Decrypt
    let plain = crate::backup::crypto::decrypt(&bytes, &state.paths.keys_dir.join("backup.key"))
        .map_err(|e| e.to_string())?;
    // 4. Verify SQLite
    let tmp_path = std::env::temp_dir().join(format!("verify-{}.sqlite", project_id));
    std::fs::write(&tmp_path, &plain).map_err(|e| e.to_string())?;
    let conn = sqlx::sqlite::SqlitePool::connect(&format!("sqlite://{}", tmp_path.display()))
        .await.map_err(|e| e.to_string())?;
    let _: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM events").fetch_one(&conn).await
        .map_err(|e| e.to_string())?;
    let _ = std::fs::remove_file(&tmp_path);
    tracing::info!(target: "backup_verify", "{project_id} backup {} verified OK ({} bytes)", backup.backup_id, plain.len());
    Ok(())
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/backup/verify_weekly.rs || { echo "FAIL"; exit 1; }
grep -q "verify_one" apps/admin/src-tauri/src/backup/verify_weekly.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
