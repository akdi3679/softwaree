# TASK ID: USER-001.3
# TITLE: Add User error and AppState
# STATUS: pending
# DEPENDENCIES: USER-001.2
# ALLOWED FILES: product/apps/user/src-tauri/src/error.rs, product/apps/user/src-tauri/src/state.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add error type and app state for User.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src-tauri/src/error.rs`:

```rust
use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("io: {0}")]
    Io(#[from] std::io::Error),
    #[error("db: {0}")]
    Db(#[from] sqlx::Error),
    #[error("crypto: {0}")]
    Crypto(String),
    #[error("network: {0}")]
    Network(String),
    #[error("protocol: {0}")]
    Protocol(String),
    #[error("auth: {0}")]
    Auth(String),
    #[error("validation: {0}")]
    Validation(String),
    #[error("not found: {0}")]
    NotFound(String),
    #[error("permission denied: {0}")]
    PermissionDenied(String),
    #[error("conflict: {0}")]
    Conflict(String),
    #[error("invalid state: {0}")]
    InvalidState(String),
    #[error("internal: {0}")]
    Internal(String),
}

pub type AppResult<T> = Result<T, AppError>;

impl Serialize for AppError {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&self.to_string())
    }
}

impl From<ed25519_dalek::SignatureError> for AppError {
    fn from(e: ed25519_dalek::SignatureError) -> Self {
        AppError::Crypto(e.to_string())
    }
}

impl From<base64::DecodeError> for AppError {
    fn from(e: base64::DecodeError) -> Self {
        AppError::Crypto(format!("base64: {e}"))
    }
}
```

Create `product/apps/user/src-tauri/src/state.rs`:

```rust
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;
use tauri::path::PathResolver;

use crate::crypto::device_key::DeviceKey;
use crate::error::AppResult;
use crate::sync::client::SyncClient;

pub struct AppPaths {
    pub data_dir: PathBuf,
    pub keys_dir: PathBuf,
    pub projections_dir: PathBuf,
    pub logs_dir: PathBuf,
    pub tailscale_state: PathBuf,
}

impl AppPaths {
    pub fn new(resolver: &PathResolver) -> AppResult<Self> {
        let data_dir = resolver.app_data_dir()?;
        let logs_dir = resolver.app_log_dir()?;
        Ok(Self {
            keys_dir: data_dir.join("keys"),
            projections_dir: data_dir.join("projections"),
            tailscale_state: data_dir.join("tailscale"),
            data_dir,
            logs_dir,
        })
    }
}

pub struct DeviceIdentity {
    pub device_id: String,
    pub key: DeviceKey,
}

pub struct AppState {
    pub paths: AppPaths,
    pub device: Arc<DeviceIdentity>,
    pub sync: Arc<RwLock<Option<SyncClient>>>,
    pub active_projection: Arc<RwLock<Option<crate::db::projection_db::ProjectionDb>>>,
}

impl AppState {
    pub fn new(paths: AppPaths) -> AppResult<Self> {
        std::fs::create_dir_all(&paths.keys_dir)?;
        std::fs::create_dir_all(&paths.projections_dir)?;
        std::fs::create_dir_all(&paths.logs_dir)?;

        let device = crate::crypto::device_identity::load_or_create(&paths.keys_dir)?;
        let device_id = device.public_key_b64();
        let key = device;

        Ok(Self {
            paths,
            device: Arc::new(DeviceIdentity { device_id, key }),
            sync: Arc::new(RwLock::new(None)),
            active_projection: Arc::new(RwLock::new(None)),
        })
    }
}
```

## TESTS

```bash
cd product
test -f apps/user/src-tauri/src/error.rs || { echo "FAIL"; exit 1; }
test -f apps/user/src-tauri/src/state.rs || { echo "FAIL"; exit 1; }
grep -q "AppState" apps/user/src-tauri/src/state.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
