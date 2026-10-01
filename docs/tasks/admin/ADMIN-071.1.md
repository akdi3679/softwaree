# TASK ID: ADMIN-071.1
# TITLE: Add Admin: scheduled tasks (cron-like)
# STATUS: pending
# DEPENDENCIES: CLOUD-024.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/commands/cron.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Customer can schedule a command to run at a future time.

## REQUIRED IMPLEMENTATION

Add to `Cargo.toml`:
```toml
tokio-cron-scheduler = "0.9"
```

Create `product/apps/admin/src-tauri/src/commands/cron.rs`:

```rust
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use tauri::State;
use tokio_cron_scheduler::{Job, JobScheduler};
use crate::error::AppResult;
use crate::state::AppState;

#[derive(Deserialize)]
pub struct ScheduleInput {
    pub name: String,
    pub cron: String,            // "0 9 * * *" etc.
    pub command_type: String,
    pub payload: serde_json::Value,
}

#[derive(Serialize)]
pub struct ScheduleResult {
    pub job_id: String,
    pub next_run_at: String,
}

pub async fn schedule(state: State<'_, AppState>, project_id: String, input: ScheduleInput) -> AppResult<ScheduleResult> {
    let job_id = format!("cron_{}", uuid::Uuid::new_v4());
    // Persist first
    let pool = &state.projects.read().await.get(&project_id).cloned()
        .ok_or_else(|| crate::error::AppError::NotFound("project".into()))?.db;
    sqlx::query("INSERT INTO cron_jobs (id, name, cron, command_type, payload_json, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)")
        .bind(&job_id).bind(&input.name).bind(&input.cron).bind(&input.command_type).bind(input.payload.to_string())
        .execute(pool).await?;
    // Register with the in-process scheduler
    let sched = state.scheduler.read().await.clone();
    let job = Job::new_async(input.cron.as_str(), move |_uuid, _lock| {
        Box::pin(async move {
            // Dispatch the command
            tracing::info!(target: "cron", "running job {job_id}");
        })
    })?;
    sched.add(job).await?;
    Ok(ScheduleResult { job_id, next_run_at: chrono::Utc::now().to_rfc3339() })
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/commands/cron.rs || { echo "FAIL"; exit 1; }
grep -q "schedule" apps/admin/src-tauri/src/commands/cron.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
