use serde_json::Value;
use tauri::State;

use crate::error::{AppError, AppResult};
use crate::modules::query as module_query_lib;
use crate::state::AppState;

/// Query a business module by type.
///
/// V1 (in-process): the module's `handle_query` is called directly. If
/// the module returns a SQL descriptor, we run it against the project
/// DB. If the module cannot answer (missing projection table), we fall
/// back to reading from the event log.
#[tauri::command]
pub async fn module_query(
    state: State<'_, AppState>,
    project_id: String,
    query_type: String,
    payload: Value,
) -> AppResult<Value> {
    let pool = {
        let projects = state.projects.read().await;
        projects
            .get(&project_id)
            .map(|h| h.db.clone())
            .ok_or_else(|| {
                AppError::NotFound(format!("project {project_id} not open"))
            })?
    };

    module_query_lib::run_query(&pool, &query_type, &payload).await
}

/// Search patients in a project.
///
/// Convenience wrapper that the PatientSearch component uses. Delegates
/// to `module_query` with `query_type = "patient.search"`.
#[tauri::command]
pub async fn search_patients(
    state: State<'_, AppState>,
    project_id: String,
    q: String,
    include_archived: bool,
) -> AppResult<Value> {
    let payload = serde_json::json!({
        "query": q,
        "include_archived": include_archived,
    });
    module_query(state, project_id, "patient.search".to_string(), payload).await
}