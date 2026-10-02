use serde::{Deserialize, Serialize};
use tauri::State;
use crate::error::AppResult;
use crate::state::AppState;

#[derive(Debug, Deserialize, Serialize)]
pub struct Settings {
    pub log_level: String,
    pub sync_port: u16,
    pub metrics_port: u16,
    pub auto_update: bool,
}

#[tauri::command]
pub async fn update_settings(state: State<'_, AppState>, settings: Settings) -> AppResult<()> {
    let config_path = state.paths.data_dir.join("settings.json");
    let json = serde_json::to_string_pretty(&settings)
        .map_err(|e| crate::error::AppError::Internal(e.to_string()))?;
    tokio::fs::write(&config_path, json).await?;
    Ok(())
}
