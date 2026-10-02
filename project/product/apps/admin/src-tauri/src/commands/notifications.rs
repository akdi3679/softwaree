use serde::{Deserialize, Serialize};
use tauri::State;

use crate::error::{AppError, AppResult};
use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct Notification {
    pub id: String,
    pub r#type: String,
    pub title: String,
    pub body: String,
    pub action_url: Option<String>,
    pub read: bool,
    pub created_at: String,
}

#[tauri::command]
pub async fn list_notifications(state: State<'_, AppState>) -> AppResult<Vec<Notification>> {
    let guard = state.system_db.read().await;
    let db = guard
        .as_ref()
        .ok_or_else(|| AppError::NotFound("system db not open".into()))?;
    let rows: Vec<(String, String, String, String, Option<String>, i64, String)> = sqlx::query_as(
        "SELECT id, type, title, body, action_url, read, created_at FROM notifications ORDER BY created_at DESC LIMIT 50",
    )
    .fetch_all(db)
    .await?;
    Ok(rows
        .into_iter()
        .map(|(id, ty, title, body, action_url, read, created_at)| Notification {
            id,
            r#type: ty,
            title,
            body,
            action_url,
            read: read != 0,
            created_at,
        })
        .collect())
}

#[tauri::command]
pub async fn mark_notification_read(state: State<'_, AppState>, id: String) -> AppResult<()> {
    let guard = state.system_db.read().await;
    let db = guard
        .as_ref()
        .ok_or_else(|| AppError::NotFound("system db not open".into()))?;
    sqlx::query("UPDATE notifications SET read = 1 WHERE id = ?")
        .bind(id)
        .execute(db)
        .await?;
    Ok(())
}