use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use tauri::State;

use crate::authz::engine;
use crate::error::{AppError, AppResult};
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct ForgetRequest {
    pub user_id: String,
    pub reason: String,
}

#[derive(Debug, Serialize)]
pub struct ForgetResult {
    pub user_id: String,
    pub events_affected: i64,
    pub audit_entries_redacted: i64,
}

pub async fn forget_user(
    pool: &SqlitePool,
    actor_user_id: &str,
    _device_id: &str,
    request: ForgetRequest,
) -> AppResult<ForgetResult> {
    engine::require(pool, actor_user_id, "users.manage").await?;

    let exists: Option<String> = sqlx::query_scalar("SELECT state FROM users WHERE id = ?")
        .bind(&request.user_id)
        .fetch_optional(pool)
        .await?;
    if exists.is_none() {
        return Err(AppError::NotFound(format!("user {}", request.user_id)));
    }

    let like_pattern = format!("%\"user_id\":\"{}\"%", request.user_id);

    let events_affected: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM events WHERE actor_user_id = ? OR payload LIKE ?",
    )
    .bind(&request.user_id)
    .bind(&like_pattern)
    .fetch_one(pool)
    .await
    .unwrap_or(0);

    let mut tx = pool.begin().await?;

    sqlx::query("UPDATE events SET actor_user_id = '[REDACTED]' WHERE actor_user_id = ?")
        .bind(&request.user_id)
        .execute(&mut *tx)
        .await?;

    sqlx::query(
        "UPDATE audit_entries SET actor_user_id = '[REDACTED]' WHERE actor_user_id = ?",
    )
    .bind(&request.user_id)
    .execute(&mut *tx)
    .await?;

    let audit_redacted: i64 = sqlx::query(
        "DELETE FROM user_roles WHERE user_id = ?",
    )
    .bind(&request.user_id)
    .execute(&mut *tx)
    .await
    .map(|r| r.rows_affected() as i64)
    .unwrap_or(0);

    sqlx::query("DELETE FROM users WHERE id = ?")
        .bind(&request.user_id)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;

    Ok(ForgetResult {
        user_id: request.user_id,
        events_affected,
        audit_entries_redacted: audit_redacted,
    })
}

#[tauri::command]
pub async fn gdpr_forget_user(
    state: State<'_, AppState>,
    project_id: String,
    actor_user_id: String,
    user_id: String,
    reason: String,
) -> AppResult<ForgetResult> {
    let handle = {
        let projects = state.projects.read().await;
        projects
            .get(&project_id)
            .cloned()
            .ok_or_else(|| AppError::NotFound(format!("project {project_id}")))?
    };
    let device_id = state.device_id();
    forget_user(
        &handle.db,
        &actor_user_id,
        &device_id,
        ForgetRequest { user_id, reason },
    )
    .await
}