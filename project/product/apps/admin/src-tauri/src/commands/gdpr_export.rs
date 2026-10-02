use std::fs::File;
use std::io::Write;
use tauri::State;
use walkdir::WalkDir;
use zip::write::FileOptions;

use crate::error::{AppError, AppResult};
use crate::state::AppState;

fn zip_err(e: impl std::fmt::Display) -> AppError {
    AppError::Io(std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))
}

fn csv_escape(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for ch in s.chars() {
        if ch == '"' {
            out.push('"');
            out.push('"');
        } else {
            out.push(ch);
        }
    }
    out
}

#[tauri::command]
pub async fn gdpr_export(
    state: State<'_, AppState>,
    project_id: String,
    output_path: String,
) -> AppResult<u64> {
    let handle = state
        .projects
        .read()
        .await
        .get(&project_id)
        .cloned()
        .ok_or_else(|| AppError::NotFound(format!("project {project_id}")))?;

    let out = File::create(&output_path).map_err(AppError::Io)?;
    let mut zip = zip::ZipWriter::new(out);
    let opts: FileOptions<()> = FileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    // 1. project.json
    let project_row: Result<(String, String), sqlx::Error> =
        sqlx::query_as("SELECT id, name FROM projects WHERE id = ?")
            .bind(&project_id)
            .fetch_one(&handle.db)
            .await;
    if let Ok((id, name)) = project_row {
        zip.start_file("project.json", opts).map_err(zip_err)?;
        let json = serde_json::json!({ "id": id, "name": name });
        let bytes = serde_json::to_string_pretty(&json).unwrap();
        zip.write_all(bytes.as_bytes()).map_err(AppError::Io)?;
    }

    // 2. events.csv
    zip.start_file("events.csv", opts).map_err(zip_err)?;
    zip.write_all(b"sequence,event_type,aggregate_id,occurred_at,payload\n").map_err(AppError::Io)?;
    let events: Vec<(i64, String, String, String, String)> = sqlx::query_as(
        "SELECT sequence, event_type, aggregate_id, occurred_at, payload FROM events ORDER BY sequence ASC"
    ).fetch_all(&handle.db).await?;
    for (seq, et, ai, at, payload) in events {
        let escaped = csv_escape(&payload);
        let line = format!("{seq},{et},{ai},{at},\"{escaped}\"\n");
        zip.write_all(line.as_bytes()).map_err(AppError::Io)?;
    }

    // 3. audit.csv
    zip.start_file("audit.csv", opts).map_err(zip_err)?;
    zip.write_all(b"id,occurred_at,action,result,entry_hash\n").map_err(AppError::Io)?;
    if let Ok(rows) = sqlx::query_as::<_, (i64, String, String, String, String)>(
        "SELECT id, occurred_at, action, result, entry_hash FROM audit_entries ORDER BY id ASC"
    ).fetch_all(&handle.db).await {
        for (id, at, action, result, hash) in rows {
            let line = format!("{id},{at},{action},{result},{hash}\n");
            zip.write_all(line.as_bytes()).map_err(AppError::Io)?;
        }
    }

    // 4. attachments
    let attachments_dir = state.paths.projects_dir.join("attachments");
    if attachments_dir.exists() {
        for entry in WalkDir::new(&attachments_dir).into_iter().filter_map(|e| e.ok()) {
            if entry.file_type().is_file() {
                let rel = entry.path().strip_prefix(&attachments_dir).unwrap().to_string_lossy().to_string();
                let name = format!("attachments/{rel}");
                zip.start_file(name, opts).map_err(zip_err)?;
                let bytes = std::fs::read(entry.path()).map_err(AppError::Io)?;
                zip.write_all(&bytes).map_err(AppError::Io)?;
            }
        }
    }

    let _ = zip.finish();
    Ok(std::fs::metadata(&output_path).map_err(AppError::Io)?.len())
}
