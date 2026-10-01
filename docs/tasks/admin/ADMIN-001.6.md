# TASK ID: ADMIN-001.6
# TITLE: Define AppPaths
# STATUS: pending
# DEPENDENCIES: ADMIN-001.5
# ALLOWED FILES: product/apps/admin/src-tauri/src/paths.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define the application paths — where projects, modules, logs, keys live on disk.

## REQUIRED IMPLEMENTATION

Replace `product/apps/admin/src-tauri/src/paths.rs` with:

```rust
use std::path::PathBuf;
use tauri::{AppHandle, Manager, Runtime};
use crate::error::AppError;

/// Resolved paths used by the Admin app.
#[derive(Debug, Clone)]
pub struct AppPaths {
    /// Root data dir (e.g., ~/.local/share/com.product.admin/)
    pub data_dir: PathBuf,
    /// Directory containing all project subdirectories
    pub projects_dir: PathBuf,
    /// Directory containing local keys (encrypted by OS keychain)
    pub keys_dir: PathBuf,
    /// Directory for module binaries
    pub modules_dir: PathBuf,
    /// Directory for log files
    pub logs_dir: PathBuf,
    /// WireGuard interface state file
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
```

Replace `product/apps/admin/src-tauri/src/error.rs` with:

```rust
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("path resolution failed: {0}")]
    PathResolution(String),
    #[error("path creation failed: {0}: {1}")]
    PathCreation(std::path::PathBuf, String),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("database error: {0}")]
    Database(String),
    #[error("crypto error: {0}")]
    Crypto(String),
    #[error("module error: {0}")]
    Module(String),
    #[error("network error: {0}")]
    Network(String),
    #[error("permission denied: {0}")]
    PermissionDenied(String),
    #[error("not found: {0}")]
    NotFound(String),
    #[error("conflict: {0}")]
    Conflict(String),
    #[error("invalid state: {0}")]
    InvalidState(String),
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/paths.rs || { echo "FAIL"; exit 1; }
grep -q "AppPaths" apps/admin/src-tauri/src/paths.rs || { echo "FAIL"; exit 1; }
grep -q "projects_dir" apps/admin/src-tauri/src/paths.rs || { echo "FAIL: no projects_dir"; exit 1; }
test -f apps/admin/src-tauri/src/error.rs || { echo "FAIL: no error"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL: cargo check"; exit 1; }
echo "OK"
```
