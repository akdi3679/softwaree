use serde::Serialize;

#[derive(Serialize)]
pub struct PongResponse {
    pub message: String,
    pub timestamp: String,
}

#[tauri::command]
pub async fn ping() -> Result<PongResponse, String> {
    Ok(PongResponse {
        message: "pong".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    })
}
