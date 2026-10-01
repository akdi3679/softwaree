# TASK ID: SUPPORT-002.1
# TITLE: Add support diagnostic bundle export (Admin side)
# STATUS: pending
# DEPENDENCIES: PORTAL-003.3
# ALLOWED FILES: product/apps/admin/src-tauri/src/commands/diagnostic.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Customer clicks "Get help" → creates a tarball of relevant logs, configs (no secrets), project state → for support.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/commands/diagnostic.rs`:

```rust
use std::path::PathBuf;
use std::time::SystemTime;
use tauri::State;
use tokio::fs;
use tokio::process::Command;
use crate::error::AppResult;
use crate::state::AppState;

#[tauri::command]
pub async fn export_diagnostic_bundle(
    state: State<'_, AppState>,
    project_id: String,
    output_path: String,
) -> AppResult<String> {
    let tmp = std::env::temp_dir().join(format!("diag-bundle-{}", SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_millis()));
    fs::create_dir_all(&tmp).await?;

    // 1. app version
    let version = env!("CARGO_PKG_VERSION");
    fs::write(tmp.join("version.txt"), version).await?;

    // 2. anonymized config (no secrets)
    let mut config = String::new();
    config.push_str(&format!("device_id: {}\n", state.device_id));
    config.push_str(&format!("admin_count: {}\n", state.projects.read().await.len()));
    fs::write(tmp.join("config.txt"), config).await?;

    // 3. last 1000 audit events
    let handle = state.projects.read().await.get(&project_id).cloned()
        .ok_or_else(|| crate::error::AppError::NotFound("project".into()))?;
    let events: Vec<(i64, String, String, String)> = sqlx::query_as(
        "SELECT sequence, event_type, actor_id, occurred_at FROM events ORDER BY sequence DESC LIMIT 1000"
    ).fetch_all(&handle.db).await?;
    let mut csv = String::new();
    csv.push_str("sequence,event_type,actor_id,occurred_at\n");
    for (seq, et, actor, at) in events {
        csv.push_str(&format!("{},{},{},{}\n", seq, et, actor, at));
    }
    fs::write(tmp.join("events.csv"), csv).await?;

    // 4. log tail
    let log_path = state.paths.logs_dir.join("admin.log");
    if log_path.exists() {
        let bytes = fs::read(&log_path).await?;
        let tail: Vec<u8> = bytes.into_iter().rev().take(50_000).collect::<Vec<_>>().into_iter().rev().collect();
        fs::write(tmp.join("admin.log"), tail).await?;
    }

    // 5. create tarball
    let output = std::path::PathBuf::from(&output_path);
    let status = Command::new("tar")
        .arg("czf")
        .arg(&output)
        .arg("-C")
        .arg(&tmp)
        .arg(".")
        .status()
        .await
        .map_err(|e| crate::error::AppError::Io(format!("tar spawn: {e}")))?;
    if !status.success() {
        return Err(crate::error::AppError::Io("tar failed".into()));
    }

    // 6. cleanup
    let _ = fs::remove_dir_all(&tmp).await;

    Ok(output.to_string_lossy().to_string())
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/commands/diagnostic.rs || { echo "FAIL"; exit 1; }
grep -q "export_diagnostic_bundle" apps/admin/src-tauri/src/commands/diagnostic.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
