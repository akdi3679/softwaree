use tauri::State;
use crate::error::AppResult;
use crate::state::AppState;

#[tauri::command]
pub async fn import_patients_csv(
    _state: State<'_, AppState>,
    _project_id: String,
    _file_path: String,
) -> AppResult<u32> {
    // Placeholder: real CSV parsing not implemented yet.
    Ok(0)
}
