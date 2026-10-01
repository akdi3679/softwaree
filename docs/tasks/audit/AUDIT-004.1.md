# TASK ID: AUDIT-004.1
# TITLE: Add audit: GDPR data export for Admin
# STATUS: pending
# DEPENDENCIES: SYNC-006.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/commands/gdpr_export.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Customer can export all data in a portable format.

## REQUIRED IMPLEMENTATION

Add to `Cargo.toml`:
```toml
zip = "2"
```

Create `product/apps/admin/src-tauri/src/commands/gdpr_export.rs`:

```rust
use chrono::Utc;
use sqlx::SqlitePool;
use std::fs::File;
use std::io::Write;
use tauri::State;
use walkdir::WalkDir;
use zip::write::FileOptions;
use crate::error::AppResult;
use crate::state::AppState;

#[tauri::command]
pub async fn gdpr_export(
    state: State<'_, AppState>,
    project_id: String,
    output_path: String,
) -> AppResult<u64> {
    let handle = state.projects.read().await.get(&project_id).cloned()
        .ok_or_else(|| crate::error::AppError::NotFound("project".into()))?;
    let out = File::create(&output_path).map_err(|e| crate::error::AppError::Io(e.to_string()))?;
    let mut zip = zip::ZipWriter::new(out);
    let opts = FileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    // 1. project.json
    zip.start_file("project.json", opts).map_err(|e| crate::error::AppError::Io(e.to_string()))?;
    let project_json: (String, String, String) = sqlx::query_as("SELECT id, name, plan FROM projects WHERE id = ?")
        .bind(&project_id).fetch_one(&handle.db).await?;
    zip.write_all(serde_json::to_string_pretty(&project_json).unwrap().as_bytes()).map_err(|e| crate::error::AppError::Io(e.to_string()))?;

    // 2. events.csv
    zip.start_file("events.csv", opts).map_err(|e| crate::error::AppError::Io(e.to_string()))?;
    zip.write_all(b"sequence,event_type,aggregate_id,actor_id,occurred_at,payload\n").map_err(|e| crate::error::AppError::Io(e.to_string()))?;
    let events: Vec<(i64, String, String, String, String, String)> = sqlx::query_as("SELECT sequence, event_type, aggregate_id, actor_id, occurred_at, payload FROM events ORDER BY sequence ASC")
        .fetch_all(&handle.db).await?;
    for (seq, et, ai, actor, at, payload) in events {
        let line = format!("{},{},{},{},{},\"{}\"\n", seq, et, ai, actor, at, payload.replace('"', "\"\""));
        zip.write_all(line.as_bytes()).map_err(|e| crate::error::AppError::Io(e.to_string()))?;
    }
    // 3. modules manifest
    zip.start_file("modules.json", opts).map_err(|e| crate::error::AppError::Io(e.to_string()))?;
    let modules: Vec<(String, String, String, String)> = sqlx::query_as("SELECT id, name, version, manifest_json FROM modules")
        .fetch_all(&handle.db).await?;
    zip.write_all(serde_json::to_string_pretty(&modules).unwrap().as_bytes()).map_err(|e| crate::error::AppError::Io(e.to_string()))?;
    // 4. attachments
    let attachments_dir = state.paths.projections_dir.join("attachments");
    if attachments_dir.exists() {
        for entry in WalkDir::new(attachments_dir).into_iter().filter_map(|e| e.ok()) {
            if entry.file_type().is_file() {
                let rel = entry.path().strip_prefix(&attachments_dir).unwrap().to_string_lossy().to_string();
                zip.start_file(format!("attachments/{rel}"), opts).map_err(|e| crate::error::AppError::Io(e.to_string()))?;
                let bytes = std::fs::read(entry.path()).map_err(|e| crate::error::AppError::Io(e.to_string()))?;
                zip.write_all(&bytes).map_err(|e| crate::error::AppError::Io(e.to_string()))?;
            }
        }
    }
    let _ = zip.finish();
    Ok(std::fs::metadata(&output_path).map_err(|e| crate::error::AppError::Io(e.to_string()))?.len())
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/commands/gdpr_export.rs || { echo "FAIL"; exit 1; }
grep -q "gdpr_export" apps/admin/src-tauri/src/commands/gdpr_export.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
