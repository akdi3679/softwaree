use serde::{Deserialize, Serialize};
use tauri::State;
use crate::error::AppResult;
use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct AuditEntry {
    pub id: i64,
    pub occurred_at: String,
    pub actor_user_id: Option<String>,
    pub action: String,
    pub target_type: Option<String>,
    pub target_id: Option<String>,
    pub result: String,
    pub details: Option<String>,
}

#[tauri::command]
pub async fn list_audit_entries(
    state: State<'_, AppState>,
    project_id: String,
    limit: i64,
    offset: i64,
) -> AppResult<Vec<AuditEntry>> {
    let projects = state.projects.read().await;
    let handle = projects.get(&project_id).ok_or_else(|| {
        crate::error::AppError::NotFound(format!("project {project_id} not open"))
    })?;
    let rows: Vec<(i64, String, Option<String>, String, Option<String>, Option<String>, String, Option<String>)> = sqlx::query_as(
        r#"
        SELECT id, occurred_at, actor_user_id, action, target_type, target_id, result, details
        FROM audit_entries
        ORDER BY id DESC
        LIMIT ? OFFSET ?
        "#,
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(&handle.db)
    .await?;
    Ok(rows.into_iter().map(|r| AuditEntry {
        id: r.0, occurred_at: r.1, actor_user_id: r.2, action: r.3,
        target_type: r.4, target_id: r.5, result: r.6, details: r.7,
    }).collect())
}
