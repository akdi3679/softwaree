# TASK ID: ADMIN-062.1
# TITLE: Add Admin: comprehensive smoke test on startup
# STATUS: pending
# DEPENDENCIES: ADMIN-061.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/startup_smoke.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
On startup, run a quick self-test. If anything is broken, refuse to start with a clear error.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/startup_smoke.rs`:

```rust
use crate::error::AppResult;
use crate::state::AppState;

/// Runs in < 1s. If anything fails, the app refuses to start.
pub async fn run(state: &AppState) -> AppResult<()> {
    // 1. State
    let projects = state.projects.read().await;
    tracing::info!("startup: {} projects loaded", projects.len());
    drop(projects);
    // 2. Disk
    let free = fs2::available_space(&state.paths.data_dir).map_err(|e| crate::error::AppError::Io(e.to_string()))?;
    tracing::info!("startup: {} bytes free on data dir", free);
    if free < 100 * 1024 * 1024 { return Err(crate::error::AppError::DiskFull); }
    // 3. Our WireGuard mesh
    let ts = crate::sync::tailscale::status().await.map_err(|e| crate::error::AppError::Network(format!("tailscale: {e}")))?;
    if !ts.online {
        tracing::warn!("startup: tailscale is offline; sync will retry");
    }
    // 4. Cloud
    let cloud_ok = crate::cloud::ping(&state.cloud).await.is_ok();
    tracing::info!("startup: cloud reachable: {cloud_ok}");
    // 5. Migrations
    for (_, handle) in state.projects.read().await.iter() {
        crate::db::migrations::verify_schema(&handle.db).await?;
    }
    Ok(())
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/startup_smoke.rs || { echo "FAIL"; exit 1; }
grep -q "startup_smoke" apps/admin/src-tauri/src/startup_smoke.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
