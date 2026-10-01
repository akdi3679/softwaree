# TASK ID: BACKUP-001.1
# TITLE: Add backup scheduler (cron-like)
# STATUS: pending
# DEPENDENCIES: OBS-001.4
# ALLOWED FILES: product/apps/admin/src-tauri/src/backup/scheduler.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Background task that creates an encrypted backup on a schedule (daily, hourly, or manual).

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/backup/scheduler.rs`:

```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;
use tokio::time::sleep;

use crate::backup::snapshot;
use crate::backup::crypto;
use crate::backup::upload;
use crate::error::AppResult;
use crate::state::AppState;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum BackupCadence {
    Disabled,
    Hourly,
    Daily,
    Weekly,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupSchedule {
    pub project_id: String,
    pub cadence: BackupCadence,
    pub last_run: Option<String>,
    pub last_backup_id: Option<String>,
    pub passphrase: String,
    pub note_prefix: Option<String>,
}

pub struct SchedulerState {
    pub schedules: Vec<BackupSchedule>,
}

impl Default for SchedulerState {
    fn default() -> Self { Self { schedules: vec![] } }
}

pub fn spawn(state: Arc<AppState>, schedules: Arc<RwLock<SchedulerState>>) {
    tokio::spawn(async move {
        loop {
            sleep(Duration::from_secs(60)).await; // check every minute
            let snapshot = schedules.read().await.schedules.clone();
            for sched in snapshot {
                if !should_run(&sched).await { continue; }
                if let Err(e) = run_one(&state, &sched).await {
                    tracing::error!(project = %sched.project_id, error = %e, "scheduled backup failed");
                }
            }
        }
    });
}

async fn should_run(sched: &BackupSchedule) -> bool {
    if sched.cadence == BackupCadence::Disabled { return false; }
    let last = match &sched.last_run {
        Some(s) => match DateTime::parse_from_rfc3339(s) {
            Ok(d) => d.with_timezone(&Utc),
            Err(_) => return true,
        },
        None => return true,
    };
    let now = Utc::now();
    match sched.cadence {
        BackupCadence::Hourly => (now - last).num_hours() >= 1,
        BackupCadence::Daily => (now - last).num_days() >= 1,
        BackupCadence::Weekly => (now - last).num_weeks() >= 1,
        BackupCadence::Disabled => false,
    }
}

async fn run_one(state: &AppState, sched: &BackupSchedule) -> AppResult<String> {
    let projects = state.projects.read().await;
    let handle = match projects.get(&sched.project_id) {
        Some(h) => h,
        None => return Ok(String::new()),
    };
    let snap = snapshot::build(&handle.db, &sched.project_id, &sched.project_id, sched.note_prefix.clone()).await?;
    let path: String = sqlx::query_scalar("SELECT file_path FROM projects WHERE id = ?")
        .bind(&sched.project_id)
        .fetch_one(&handle.db).await?;
    let db_bytes = tokio::fs::read(&path).await?;
    let encrypted = crypto::encrypt(&db_bytes, state.device.signing_key(), &sched.passphrase)?;
    let result = upload::upload(
        &state.http_client,
        &state.cloud_base_url,
        &state.cloud_token.lock().await,
        &sched.project_id,
        &snap,
        &encrypted,
    ).await?;
    Ok(result.backup_id)
}

pub async fn set(state: &RwLock<SchedulerState>, schedule: BackupSchedule) {
    let mut s = state.write().await;
    if let Some(existing) = s.schedules.iter_mut().find(|x| x.project_id == schedule.project_id) {
        *existing = schedule;
    } else {
        s.schedules.push(schedule);
    }
}

pub async fn get(state: &RwLock<SchedulerState>, project_id: &str) -> Option<BackupSchedule> {
    state.read().await.schedules.iter().find(|x| x.project_id == project_id).cloned()
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/backup/scheduler.rs || { echo "FAIL"; exit 1; }
grep -q "BackupCadence" apps/admin/src-tauri/src/backup/scheduler.rs || { echo "FAIL"; exit 1; }
grep -q "fn spawn" apps/admin/src-tauri/src/backup/scheduler.rs || { echo "FAIL: no spawn"; exit 1; }
echo "OK"
```
