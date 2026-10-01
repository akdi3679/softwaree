# TASK ID: ADMIN-001.7
# TITLE: Define AppState
# STATUS: pending
# DEPENDENCIES: ADMIN-001.6
# ALLOWED FILES: product/apps/admin/src-tauri/src/state.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define the AppState — runtime state shared across Tauri commands.

## REQUIRED IMPLEMENTATION

Replace `product/apps/admin/src-tauri/src/state.rs` with:

```rust
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::error::AppError;
use crate::paths::AppPaths;

/// Runtime state for the Admin app.
///
/// Held by Tauri as managed state. Accessible from any Tauri command via
/// the `tauri::State<AppState>` extractor.
pub struct AppState {
    /// Resolved filesystem paths
    pub paths: AppPaths,

    /// Open project databases, keyed by ProjectId
    pub projects: Arc<RwLock<std::collections::HashMap<String, ProjectHandle>>>,

    /// Current sync state per user (will be filled in ADMIN-008)
    pub sync: Arc<RwLock<SyncState>>,
}

pub struct ProjectHandle {
    pub project_id: String,
    pub db_path: PathBuf,
    pub db: sqlx::SqlitePool,
    pub last_sequence: i64,
}

#[derive(Default)]
pub struct SyncState {
    pub connected_users: Vec<String>,
    pub last_user_heartbeat: std::collections::HashMap<String, chrono::DateTime<chrono::Utc>>,
}

impl AppState {
    pub fn new(paths: AppPaths) -> Result<Self, AppError> {
        Ok(Self {
            paths,
            projects: Arc::new(RwLock::new(Default::default())),
            sync: Arc::new(RwLock::new(SyncState::default())),
        })
    }
}
```

Add to `product/apps/admin/src-tauri/Cargo.toml` dependencies:

```toml
sqlx = { version = "0.8", features = ["runtime-tokio", "sqlite", "macros", "chrono"] }
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/state.rs || { echo "FAIL"; exit 1; }
grep -q "AppState" apps/admin/src-tauri/src/state.rs || { echo "FAIL"; exit 1; }
grep -q "sqlx" apps/admin/src-tauri/Cargo.toml || { echo "FAIL: no sqlx"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL: cargo check"; exit 1; }
echo "OK"
```
