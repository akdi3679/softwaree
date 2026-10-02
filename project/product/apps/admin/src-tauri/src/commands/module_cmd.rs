use serde_json::Value;
use tauri::State;

use crate::error::{AppError, AppResult};
use crate::modules::dispatch as module_dispatch;
use crate::state::AppState;

/// Dispatch a command into the business module that owns it.
///
/// V1 (in-process): the module is called as a Rust function via
/// `modules::dispatch::run_command`. Events + audit commit together.
///
/// V2 (planned): the same `run_command` signature will load the module
/// via Wasmtime. Only the internals of `run_command` change.
#[tauri::command]
pub async fn module_command(
    state: State<'_, AppState>,
    project_id: String,
    command_type: String,
    payload: Value,
    idempotency_key: Option<String>,
) -> AppResult<Value> {
    // Clone the project pool out of the lock before any await.
    let pool = {
        let projects = state.projects.read().await;
        projects
            .get(&project_id)
            .map(|h| h.db.clone())
            .ok_or_else(|| {
                AppError::NotFound(format!("project {project_id} not open"))
            })?
    };

    let device_id = state.device_id();
    let actor_user_id = "admin".to_string();

    module_dispatch::run_command(
        &pool,
        &actor_user_id,
        &device_id,
        &command_type,
        &payload,
        idempotency_key.as_deref(),
        None,
    )
    .await
}