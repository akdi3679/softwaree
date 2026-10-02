use tauri::State;

use crate::error::{AppError, AppResult};
use crate::search::fts;
use crate::state::AppState;

#[tauri::command]
pub async fn search(
    state: State<'_, AppState>,
    query: String,
    limit: Option<i64>,
) -> AppResult<Vec<fts::SearchResult>> {
    let proj = state.active_projection.read().await;
    let proj = proj
        .as_ref()
        .ok_or_else(|| AppError::NotFound("no active projection".into()))?;
    fts::search(&proj.pool, &query, limit.unwrap_or(50)).await
}

#[tauri::command]
pub async fn global_search(
    state: State<'_, AppState>,
    query: String,
) -> AppResult<Vec<fts::SearchResult>> {
    search(state, query, Some(50)).await
}