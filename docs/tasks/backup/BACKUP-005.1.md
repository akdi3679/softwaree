# TASK ID: BACKUP-005.1
# TITLE: Add backup — schedule multiple projects
# STATUS: pending
# DEPENDENCIES: I18N-002.3
# ALLOWED FILES: product/apps/admin/src-tauri/src/backup/scheduler.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Run all scheduled backups for all projects, not just one.

## REQUIRED IMPLEMENTATION

Edit `product/apps/admin/src-tauri/src/backup/scheduler.rs`:

```rust
use std::sync::Arc;
use tokio::time::{interval, Duration};
use crate::state::AppState;

pub fn spawn(state: Arc<AppState>) {
    tokio::spawn(async move {
        let mut ticker = interval(Duration::from_secs(60)); // check every minute
        loop {
            ticker.tick().await;
            if let Err(e) = run_all_due(&state).await {
                tracing::error!("scheduler: {e}");
            }
        }
    });
}

pub async fn run_all_due(state: &AppState) -> Result<(), String> {
    let projects = state.projects.read().await;
    for (project_id, _handle) in projects.iter() {
        // Plan: check plan's backup cadence
        let plan = state.plan_for_project(project_id).await
            .map_err(|e| e.to_string())?;
        let cadence_hours = match plan.as_str() {
            "local" => return Ok(()), // no backups
            "starter" => 168,         // weekly
            "team" => 24,             // daily
            "enterprise" => 4,        // every 4h
            _ => 24,
        };
        let last = state.last_backup_at(project_id).await;
        if last.is_none() || last.unwrap().elapsed().as_secs() > cadence_hours as u64 * 3600 {
            if let Err(e) = super::run(state, project_id.clone()).await {
                tracing::error!("backup for {project_id} failed: {e}");
            }
        }
    }
    Ok(())
}
```

Add to `state.rs`:
```rust
pub async fn plan_for_project(&self, project_id: &str) -> Result<String, crate::error::AppError> {
    let handle = self.projects.read().await.get(project_id).cloned()
        .ok_or_else(|| crate::error::AppError::NotFound("project".into()))?;
    let plan: String = sqlx::query_scalar("SELECT plan FROM projects WHERE id = ?")
        .bind(project_id).fetch_one(&handle.db).await?;
    Ok(plan)
}

pub async fn last_backup_at(&self, project_id: &str) -> Option<chrono::DateTime<chrono::Utc>> {
    // Read from the cloud's backup log
    self.cloud.last_backup_at(project_id).await.ok().flatten()
}
```

## TESTS

```bash
cd product
grep -q "run_all_due" apps/admin/src-tauri/src/backup/scheduler.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
