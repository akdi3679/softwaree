use crate::error::AppResult;

#[tauri::command]
pub async fn ping() -> AppResult<String> {
    Ok("pong".to_string())
}
