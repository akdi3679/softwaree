use chrono::Utc;
use flate2::write::GzEncoder;
use flate2::Compression;
use serde_json::json;
use std::io::Write;
use std::path::Path;
use tauri::State;

use crate::error::{AppError, AppResult};
use crate::state::AppState;

pub async fn export(state: State<'_, AppState>, output_path: String) -> AppResult<String> {
    let mut bundle = serde_json::Map::new();

    bundle.insert("admin_version".into(), json!(env!("CARGO_PKG_VERSION")));
    bundle.insert("os".into(), json!(std::env::consts::OS));
    bundle.insert("arch".into(), json!(std::env::consts::ARCH));
    bundle.insert("device_id".into(), json!(state.device_id()));
    bundle.insert("exported_at".into(), json!(Utc::now().to_rfc3339()));

    // Projects summary
    let mut projects_meta: Vec<serde_json::Value> = vec![];
    {
        let projects = state.projects.read().await;
        for (id, handle) in projects.iter() {
            let name: Option<String> =
                sqlx::query_scalar("SELECT name FROM projects WHERE id = ?")
                    .bind(id)
                    .fetch_optional(&handle.db)
                    .await
                    .ok()
                    .flatten();
            let event_count: Option<i64> = sqlx::query_scalar("SELECT COUNT(*) FROM events")
                .fetch_optional(&handle.db)
                .await
                .ok()
                .flatten();
            projects_meta.push(json!({
                "project_id": id,
                "name": name,
                "event_count": event_count,
            }));
        }
    }
    bundle.insert("projects".into(), json!(projects_meta));

    // Recent audit entries (redacted summary)
    let mut audit: Vec<serde_json::Value> = vec![];
    {
        let projects = state.projects.read().await;
        for handle in projects.values() {
            let rows: Vec<(i64, String, Option<String>, String, String)> = sqlx::query_as(
                "SELECT id, occurred_at, actor_user_id, action, result FROM audit_entries ORDER BY id DESC LIMIT 100",
            )
            .fetch_all(&handle.db)
            .await
            .unwrap_or_default();
            for (id, ts, actor, action, result) in rows {
                audit.push(json!({
                    "id": id,
                    "occurred_at": ts,
                    "actor_user_id": actor,
                    "action": action,
                    "result": result,
                }));
            }
        }
    }
    bundle.insert("audit_recent".into(), json!(audit));

    bundle.insert("recent_errors".into(), json!([]));

    let json_text = serde_json::to_string_pretty(&bundle)
        .map_err(|e| AppError::Json(e.to_string()))?;
    let mut encoder = GzEncoder::new(Vec::new(), Compression::default());
    encoder
        .write_all(json_text.as_bytes())
        .map_err(AppError::Io)?;
    let gz = encoder.finish().map_err(AppError::Io)?;

    let path = Path::new(&output_path);
    tokio::fs::write(path, &gz).await.map_err(AppError::Io)?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn export_diagnostic_bundle(
    state: State<'_, AppState>,
    output_path: String,
) -> AppResult<String> {
    export(state, output_path).await
}