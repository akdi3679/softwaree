# TASK ID: LAUNCH-007.1
# TITLE: Add backup restore drill (automated monthly test)
# STATUS: pending
# DEPENDENCIES: LAUNCH-006.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/backup/restore_drill.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Once a month: pick the latest backup, restore it to a temp location, verify.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/backup/restore_drill.rs`:

```rust
//! Once a month: take the latest backup, restore to temp, verify the SQLite
//! is openable and the events table has rows. If it fails, alert.
use std::time::Duration;
use tokio::time::interval;
use sqlx::sqlite::SqlitePool;
use crate::error::AppResult;
use crate::state::AppState;

pub fn spawn(state: std::sync::Arc<AppState>) {
    tokio::spawn(async move {
        let mut ticker = interval(Duration::from_secs(30 * 24 * 60 * 60)); // 30 days
        loop {
            ticker.tick().await;
            for (project_id, _handle) in state.projects.read().await.iter() {
                if let Err(e) = drill(state.clone(), project_id.clone()).await {
                    tracing::error!(target: "restore_drill", "{project_id} FAILED: {e}");
                    crate::cloud::alert_ops(&format!("Restore drill FAILED for {project_id}: {e}")).await;
                }
            }
        }
    });
}

pub async fn drill(state: std::std::sync::Arc<AppState>, project_id: String) -> AppResult<()> {
    // 1. Get latest backup
    let backup = state.cloud.get_latest_backup(&project_id).await?
        .ok_or_else(|| crate::error::AppError::NotFound("no backup".into()))?;
    // 2. Download
    let bytes = state.cloud.download_backup(&backup.backup_id).await?;
    // 3. Decrypt
    let plain = crate::backup::crypto::decrypt(&bytes, &state.paths.keys_dir.join("backup.key"))?;
    // 4. Restore to temp
    let tmp_path = std::env::temp_dir().join(format!("drill-{}.sqlite", project_id));
    tokio::fs::write(&tmp_path, &plain).await?;
    // 5. Open and check
    let pool = SqlitePool::connect(&format!("sqlite://{}", tmp_path.display())).await?;
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM events").fetch_one(&pool).await?;
    if count == 0 { return Err(crate::error::AppError::Validation("drill DB has 0 events".into())); }
    tracing::info!(target: "restore_drill", "{project_id} OK ({count} events restored)");
    // 6. Cleanup
    let _ = std::fs::remove_file(&tmp_path);
    Ok(())
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/backup/restore_drill.rs || { echo "FAIL"; exit 1; }
grep -q "drill" apps/admin/src-tauri/src/backup/restore_drill.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
