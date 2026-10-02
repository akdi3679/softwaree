use tauri::State;
use crate::error::AppResult;
use crate::state::AppState;

#[tauri::command]
pub async fn begin_device_replacement(
    _state: State<'_, AppState>,
    _project_id: String,
    _reason: String,
) -> AppResult<String> {
    Ok("dummy-ticket".to_string())
}

#[tauri::command]
pub async fn submit_device_replacement(
    _state: State<'_, AppState>,
    _ticket: String,
) -> AppResult<()> {
    Ok(())
}
