use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::backup::{crypto, snapshot, upload};
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

#[derive(Default)]
pub struct SchedulerState {
    pub schedules: Vec<BackupSchedule>,
}

pub fn spawn(state: Arc<AppState>, schedules: Arc<RwLock<SchedulerState>>) {
    tokio::spawn(async move {
        let mut ticker = tokio::time::interval(std::time::Duration::from_secs(60));
        ticker.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);
        loop {
            ticker.tick().await;
            let snapshot_list = schedules.read().await.schedules.clone();
            for sched in snapshot_list {
                if !should_run(&sched) { continue; }
                match run_one(&state, &sched).await {
                    Ok(backup_id) => {
                        tracing::info!(project = %sched.project_id, %backup_id, "scheduled backup ok");
                        let mut s = schedules.write().await;
                        if let Some(row) = s.schedules.iter_mut().find(|x| x.project_id == sched.project_id) {
                            row.last_run = Some(Utc::now().to_rfc3339());
                            row.last_backup_id = Some(backup_id);
                        }
                    }
                    Err(e) => {
                        tracing::error!(project = %sched.project_id, error = %e, "scheduled backup failed");
                    }
                }
            }
        }
    });
}

pub fn should_run(sched: &BackupSchedule) -> bool {
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

pub async fn run_one(state: &Arc<AppState>, sched: &BackupSchedule) -> AppResult<String> {
    let handle = {
        let projects = state.projects.read().await;
        projects.get(&sched.project_id).cloned()
    };
    let handle = match handle {
        Some(h) => h,
        None => return Ok(String::new()),
    };

    let snap = snapshot::build(
        &handle.db,
        &sched.project_id,
        &sched.project_id,
        sched.note_prefix.clone(),
    )
    .await?;

    let db_bytes = tokio::fs::read(&handle.db_path).await?;
    let device_key = state.load_device_key().await?;
    let encrypted = crypto::encrypt(&db_bytes, &device_key, &sched.passphrase)?;

    let token = state.cloud_token.lock().await.clone();
    let backup_id = upload::upload(
        &state.http_client,
        &state.cloud_base_url,
        &token,
        &sched.project_id,
        &snap,
        &encrypted,
    )
    .await?;

    Ok(backup_id)
}

// BACKUP-005.1: iterate all open projects, use plan cadence
pub async fn run_all_due(state: &Arc<AppState>) -> Result<(), String> {
    let project_ids: Vec<String> = {
        let projects = state.projects.read().await;
        projects.keys().cloned().collect()
    };
    for project_id in project_ids {
        let plan = match state.plan_for_project(&project_id).await {
            Ok(p) => p,
            Err(_) => continue,
        };
        let cadence = match plan.as_str() {
            "local" => BackupCadence::Disabled,
            "starter" => BackupCadence::Weekly,
            "team" => BackupCadence::Daily,
            "enterprise" => BackupCadence::Hourly,
            _ => BackupCadence::Daily,
        };
        if cadence == BackupCadence::Disabled { continue; }

        // Read last_run from the scheduler state if present; otherwise treat as due
        let sched = BackupSchedule {
            project_id: project_id.clone(),
            cadence,
            last_run: None,
            last_backup_id: None,
            passphrase: std::env::var("BACKUP_PASSPHRASE").unwrap_or_default(),
            note_prefix: Some("plan-cadence".to_string()),
        };
        if let Err(e) = run_one(state, &sched).await {
            tracing::warn!(project = %project_id, error = %e, "plan-cadence backup failed");
        }
    }
    Ok(())
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
    state
        .read()
        .await
        .schedules
        .iter()
        .find(|x| x.project_id == project_id)
        .cloned()
}
