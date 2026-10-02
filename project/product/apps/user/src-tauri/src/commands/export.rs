use tauri::State;
use crate::error::AppResult;
use crate::state::AppState;

#[tauri::command]
pub async fn export_projection_pdf(_state: State<'_, AppState>, _table: String, _output_path: String) -> AppResult<u32> {
    Ok(0)
}
