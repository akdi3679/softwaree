use std::path::PathBuf;
use tauri::{AppHandle, Manager, Runtime};
use crate::error::AppError;

#[derive(Debug, Clone)]
pub struct AppPaths {
    pub data_dir: PathBuf,
    pub projects_dir: PathBuf,
    pub keys_dir: PathBuf,
    pub modules_dir: PathBuf,
    pub logs_dir: PathBuf,
    pub tailscale_state: PathBuf,
}

impl AppPaths {
    pub fn resolve<R: Runtime>(app: &AppHandle<R>) -> Result<Self, AppError> {
        let data_dir = app
            .path()
            .app_data_dir()
            .map_err(|e| AppError::PathResolution(e.to_string()))?;

        let projects_dir = data_dir.join("projects");
        let keys_dir = data_dir.join("keys");
        let modules_dir = data_dir.join("modules");
        let logs_dir = data_dir.join("logs");
        let tailscale_state = data_dir.join("tailscale.state");

        for dir in [&projects_dir, &keys_dir, &modules_dir, &logs_dir] {
            std::fs::create_dir_all(dir)
                .map_err(|e| AppError::PathCreation(dir.clone(), e.to_string()))?;
        }

        Ok(Self {
            data_dir,
            projects_dir,
            keys_dir,
            modules_dir,
            logs_dir,
            tailscale_state,
        })
    }
}
