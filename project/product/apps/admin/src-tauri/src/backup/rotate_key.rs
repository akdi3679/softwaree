//! Backup encryption key rotation (local-only variant).
//!
//! The full ceremony (re-encrypt every Cloud backup) requires a live Cloud
//! client. This module handles the local half: generate a new key, save it
//! alongside the old one, and report the two paths so a follow-up job can
//! re-encrypt remote backups.

use rand::RngCore;
use std::path::PathBuf;

use crate::error::{AppError, AppResult};
use crate::state::AppState;

#[derive(Debug, serde::Serialize)]
pub struct RotationReport {
    pub old_key_path: String,
    pub new_key_path: String,
    pub generated_at: String,
    pub note: String,
}

pub fn rotate_backup_key(keys_dir: &std::path::Path) -> AppResult<RotationReport> {
    std::fs::create_dir_all(keys_dir).map_err(AppError::Io)?;

    let old_key_path: PathBuf = keys_dir.join("backup.key");
    let stamp = chrono::Utc::now().format("%Y%m%dT%H%M%SZ").to_string();
    let new_key_path: PathBuf = keys_dir.join(format!("backup.key.{stamp}"));

    let mut new_key = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut new_key);
    std::fs::write(&new_key_path, new_key).map_err(AppError::Io)?;

    // If an old key exists, move it aside with a .old suffix.
    if old_key_path.exists() {
        let archived = keys_dir.join(format!("backup.key.{stamp}.old"));
        std::fs::rename(&old_key_path, &archived).map_err(AppError::Io)?;
    }
    std::fs::rename(&new_key_path, &old_key_path).map_err(AppError::Io)?;

    Ok(RotationReport {
        old_key_path: old_key_path.to_string_lossy().to_string(),
        new_key_path: new_key_path.to_string_lossy().to_string(),
        generated_at: chrono::Utc::now().to_rfc3339(),
        note: "Local rotation only. Remote backups must be re-encrypted by a Cloud job.".to_string(),
    })
}

#[tauri::command]
pub async fn rotate_backup_key_cmd(
    state: tauri::State<'_, AppState>,
) -> AppResult<RotationReport> {
    rotate_backup_key(&state.paths.keys_dir)
}
