use tauri_plugin_updater::UpdaterExt;
use tauri::AppHandle;
use serde::Serialize;
use crate::error::{AppError, AppResult};

#[derive(Serialize)]
pub struct UpdateInfo {
    pub available: bool,
    pub current_version: String,
    pub new_version: Option<String>,
    pub release_notes: Option<String>,
}

#[tauri::command]
pub async fn check_for_update(app: AppHandle) -> AppResult<UpdateInfo> {
    let updater = app.updater().map_err(|e| AppError::Network(e.to_string()))?;
    let current = app.package_info().version.to_string();
    match updater.check().await {
        Ok(Some(update)) => Ok(UpdateInfo {
            available: true,
            current_version: current,
            new_version: Some(update.version.clone()),
            release_notes: update.body.clone(),
        }),
        Ok(None) => Ok(UpdateInfo { available: false, current_version: current, new_version: None, release_notes: None }),
        Err(e) => Err(AppError::Network(format!("update check: {e}"))),
    }
}
