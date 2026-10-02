//! Monthly restore drill: pick the latest backup, restore to temp, verify.
//! This module only performs the local verification half: it opens a backup
//! file from disk, checks the SQLite is readable, and counts rows. Remote
//! download + decrypt are deferred until the Cloud client is wired.

use std::path::Path;
use std::time::Duration;

use sqlx::sqlite::SqlitePool;
use tokio::time::interval;

use crate::error::{AppError, AppResult};

pub const DRILL_INTERVAL_SECS: u64 = 30 * 24 * 60 * 60; // 30 days

pub struct DrillReport {
    pub checked_at: String,
    pub backup_path: String,
    pub event_count: i64,
    pub ok: bool,
}

/// Open a backup SQLite file and verify it is readable.
pub async fn drill_one(backup_path: &Path) -> AppResult<DrillReport> {
    if !backup_path.exists() {
        return Err(AppError::NotFound(format!(
            "backup file not found: {}",
            backup_path.display()
        )));
    }
    let url = format!("sqlite://{}", backup_path.display());
    let pool = SqlitePool::connect(&url).await?;
    let event_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM events")
        .fetch_one(&pool)
        .await
        .unwrap_or(-1);
    pool.close().await;

    Ok(DrillReport {
        checked_at: chrono::Utc::now().to_rfc3339(),
        backup_path: backup_path.to_string_lossy().to_string(),
        event_count,
        ok: event_count >= 0,
    })
}

/// Spawn the periodic drill runner. Iterates the given backup directory and
/// drills the most recent file per project (filename prefix `proj_`).
pub fn spawn(backup_dir: std::path::PathBuf) {
    tokio::spawn(async move {
        let mut ticker = interval(Duration::from_secs(DRILL_INTERVAL_SECS));
        ticker.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);
        loop {
            ticker.tick().await;
            match std::fs::read_dir(&backup_dir) {
                Ok(entries) => {
                    for entry in entries.flatten() {
                        let path = entry.path();
                        if path.extension().and_then(|s| s.to_str()) != Some("sqlite") {
                            continue;
                        }
                        match drill_one(&path).await {
                            Ok(report) => {
                                if report.ok {
                                    tracing::info!(
                                        target: "restore_drill",
                                        backup = %report.backup_path,
                                        events = report.event_count,
                                        "drill ok"
                                    );
                                } else {
                                    tracing::error!(
                                        target: "restore_drill",
                                        backup = %report.backup_path,
                                        "drill FAILED"
                                    );
                                }
                            }
                            Err(e) => tracing::error!(target: "restore_drill", error = %e, "drill error"),
                        }
                    }
                }
                Err(e) => tracing::warn!(target: "restore_drill", error = %e, "read_dir failed"),
            }
        }
    });
}