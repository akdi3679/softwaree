use std::time::SystemTime;
use tauri::State;

use crate::error::{AppError, AppResult};
use crate::state::AppState;

#[tauri::command]
pub async fn export_diagnostic_tarball(
    state: State<'_, AppState>,
    project_id: String,
    output_path: String,
) -> AppResult<String> {
    let now_ms = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0);
    let tmp = std::env::temp_dir().join(format!("diag-bundle-{now_ms}"));
    tokio::fs::create_dir_all(&tmp).await.map_err(AppError::Io)?;

    let version = env!("CARGO_PKG_VERSION");
    tokio::fs::write(tmp.join("version.txt"), version)
        .await
        .map_err(AppError::Io)?;

    let mut config = String::new();
    config.push_str(&format!("device_id: {}\n", state.device_id()));
    config.push_str(&format!(
        "open_projects: {}\n",
        state.projects.read().await.len()
    ));
    tokio::fs::write(tmp.join("config.txt"), config)
        .await
        .map_err(AppError::Io)?;

    let handle = {
        let projects = state.projects.read().await;
        projects
            .get(&project_id)
            .cloned()
            .ok_or_else(|| AppError::NotFound(format!("project {project_id}")))?
    };
    let events: Vec<(i64, String, String, String)> = sqlx::query_as(
        "SELECT sequence, event_type, actor_user_id, occurred_at FROM events ORDER BY sequence DESC LIMIT 1000",
    )
    .fetch_all(&handle.db)
    .await
    .unwrap_or_default();
    let mut csv = String::from("sequence,event_type,actor_user_id,occurred_at\n");
    for (seq, et, actor, at) in events {
        csv.push_str(&format!("{seq},{et},{actor},{at}\n"));
    }
    tokio::fs::write(tmp.join("events.csv"), csv)
        .await
        .map_err(AppError::Io)?;

    let log_path = state.paths.logs_dir.join("admin.log");
    if log_path.exists() {
        if let Ok(bytes) = tokio::fs::read(&log_path).await {
            let start = bytes.len().saturating_sub(50_000);
            let _ = tokio::fs::write(tmp.join("admin.log"), &bytes[start..]).await;
        }
    }

    let output = std::path::PathBuf::from(&output_path);
    let tmp_clone = tmp.clone();
    let out_clone = output.clone();
    tokio::task::spawn_blocking(move || -> AppResult<()> {
        let file = std::fs::File::create(&out_clone).map_err(AppError::Io)?;
        let enc = flate2::write::GzEncoder::new(file, flate2::Compression::default());
        let mut tar = tar::Builder::new(enc);
        tar.append_dir_all(".", &tmp_clone).map_err(AppError::Io)?;
        tar.finish().map_err(AppError::Io)?;
        Ok(())
    })
    .await
    .map_err(|e| AppError::Internal(format!("tar task: {e}")))??;

    let _ = tokio::fs::remove_dir_all(&tmp).await;

    Ok(output.to_string_lossy().to_string())
}