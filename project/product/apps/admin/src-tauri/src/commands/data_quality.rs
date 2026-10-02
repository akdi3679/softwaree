use sqlx::SqlitePool;
use serde::Serialize;
use crate::error::AppResult;

#[derive(Serialize)]
pub struct QualityReport {
    pub total_events: i64,
    pub orphaned_projections: i64,
    pub duplicate_sequences: i64,
    pub missing_hashes: i64,
    pub last_event_at: Option<String>,
    pub issues: Vec<QualityIssue>,
}

#[derive(Serialize)]
pub struct QualityIssue {
    pub severity: String,
    pub code: String,
    pub message: String,
    pub count: i64,
}

pub async fn run_checks(pool: &SqlitePool) -> AppResult<QualityReport> {
    let total_events: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM events").fetch_one(pool).await?;
    let dups: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM (SELECT sequence, COUNT(*) c FROM events GROUP BY sequence HAVING c > 1)"
    ).fetch_one(pool).await?;
    let missing_hashes: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM events WHERE hash IS NULL OR prev_hash IS NULL"
    ).fetch_one(pool).await?;
    let last: Option<String> = sqlx::query_scalar("SELECT MAX(occurred_at) FROM events").fetch_one(pool).await.ok();
    let mut issues = vec![];
    if dups > 0 { issues.push(QualityIssue { severity: "high".into(), code: "DUP_SEQ".into(), message: "Duplicate event sequences".into(), count: dups }); }
    if missing_hashes > 0 { issues.push(QualityIssue { severity: "high".into(), code: "MISSING_HASH".into(), message: "Events without hash".into(), count: missing_hashes }); }
    Ok(QualityReport {
        total_events,
        orphaned_projections: 0,
        duplicate_sequences: dups,
        missing_hashes,
        last_event_at: last,
        issues,
    })
}

#[tauri::command]
pub async fn data_quality_check(
    state: tauri::State<'_, crate::state::AppState>,
    project_id: String,
) -> AppResult<QualityReport> {
    let projects = state.projects.read().await;
    let handle = projects.get(&project_id).ok_or_else(|| {
        crate::error::AppError::NotFound(format!("project {project_id} not open"))
    })?;
    run_checks(&handle.db).await
}
