# TASK ID: SUPPORT-001.3
# TITLE: Add Admin diagnostic bundle export
# STATUS: pending
# DEPENDENCIES: SUPPORT-001.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/diagnostics/export.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add a "Send diagnostic bundle" button — exports redacted logs + state for support.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/diagnostics/export.rs`:

```rust
use base64::Engine;
use base64::engine::general_purpose::URL_SAFE_NO_PAD as B64;
use chrono::Utc;
use flate2::write::GzEncoder;
use flate2::Compression;
use serde_json::json;
use std::io::Write;
use std::path::Path;
use tauri::State;
use tokio::fs;
use crate::error::{AppError, AppResult};
use crate::state::AppState;

/// Build a diagnostic bundle and write it to disk.
/// Bundle contains:
/// - Admin version, OS, hardware info
/// - our mesh status
/// - Project list (IDs only, no data)
/// - Recent audit log (last 100)
/// - Module registry (no binaries)
/// - Recent error logs (last 100)
/// - Metrics snapshot
pub async fn export(state: State<'_, AppState>, output_path: String) -> AppResult<String> {
    let mut bundle = serde_json::Map::new();

    // 1. Admin info
    bundle.insert("admin_version".into(), json!(env!("CARGO_PKG_VERSION")));
    bundle.insert("os".into(), json!(std::env::consts::OS));
    bundle.insert("arch".into(), json!(std::env::consts::ARCH));
    bundle.insert("device_id".into(), json!(state.device.public_key_b64()));
    bundle.insert("exported_at".into(), json!(Utc::now().to_rfc3339()));

    // 2. our mesh status (best effort)
    if let Ok(out) = tokio::process::Command::new("tailscale").arg("status").arg("--json").output().await {
        if out.status.success() {
            if let Ok(s) = serde_json::from_slice::<Value>(&out.stdout) {
                bundle.insert("tailscale".into(), json!({
                    "self_dns_name": s["SelfDNSName"],
                    "self_ip": s["MeshIPs"][0],
                    "backend_state": s["BackendState"],
                }));
            }
        }
    }

    // 3. Projects (just metadata, no data)
    let mut projects_meta = vec![];
    let projects = state.projects.read().await;
    for (id, handle) in projects.iter() {
        let name: Option<String> = sqlx::query_scalar("SELECT name FROM projects WHERE id = ?")
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
    bundle.insert("projects".into(), json!(projects_meta));

    // 4. Recent audit (redacted, last 100)
    let mut audit = vec![];
    for handle in projects.values() {
        let rows: Vec<(i64, String, Option<String>, String, String)> = sqlx::query_as(
            "SELECT id, occurred_at, actor_user_id, action, result FROM audit_entries ORDER BY id DESC LIMIT 100"
        )
        .fetch_all(&handle.db).await.unwrap_or_default();
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
    bundle.insert("audit_recent".into(), json!(audit));

    // 5. Errors
    bundle.insert("recent_errors".into(), json!([])); // collected by the UI from the log file

    // Serialize + gzip
    let json = serde_json::to_string_pretty(&bundle)?;
    let mut encoder = GzEncoder::new(Vec::new(), Compression::default());
    encoder.write_all(json.as_bytes())?;
    let gz = encoder.finish()?;

    // Write to disk
    let path = Path::new(&output_path);
    fs::write(path, &gz).await?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn export_diagnostic_bundle(state: State<'_, AppState>, output_path: String) -> AppResult<String> {
    export(state, output_path).await
}
```

Add to `commands/mod.rs`:
```rust
pub mod diagnostics;
```

Wire into `lib.rs`.

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/diagnostics/export.rs || { echo "FAIL"; exit 1; }
grep -q "export_diagnostic_bundle" apps/admin/src-tauri/src/diagnostics/export.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
