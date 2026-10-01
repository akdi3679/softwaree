# TASK ID: ADMIN-003.1
# TITLE: Define core error mapping for Tauri commands
# STATUS: pending
# DEPENDENCIES: ADMIN-002.8
# ALLOWED FILES: product/apps/admin/src-tauri/src/error.rs, product/apps/admin/src-tauri/src/commands/error.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Map Rust errors to serializable error contracts that can cross the Tauri IPC boundary.

## REQUIRED IMPLEMENTATION

Replace `product/apps/admin/src-tauri/src/error.rs` with:

```rust
use serde::Serialize;
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
    #[error("validation error: {0}")]
    Validation(String),
    #[error("internal error: {0}")]
    Internal(String),
}

/// Serializable error shape sent to the frontend.
/// Mirrors the ErrorContract from @product/contracts.
#[derive(Debug, Serialize)]
pub struct SerializableError {
    pub code: String,
    pub category: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
}

impl From<AppError> for SerializableError {
    fn from(err: AppError) -> Self {
        let (code, category) = match &err {
            AppError::Validation(_) => ("VALIDATION_FAILED", "validation"),
            AppError::PermissionDenied(_) => ("AUTH_INSUFFICIENT_PERMISSION", "authorization"),
            AppError::NotFound(_) => ("RESOURCE_NOT_FOUND", "not_found"),
            AppError::Conflict(_) => ("CONFLICT_VERSION_MISMATCH", "conflict"),
            AppError::Network(_) => ("NET_TRANSIENT", "transient"),
            AppError::Database(_) => ("DB_ERROR", "permanent"),
            AppError::Crypto(_) => ("CRYPTO_ERROR", "permanent"),
            AppError::Module(_) => ("MODULE_ERROR", "permanent"),
            AppError::PathResolution(_) | AppError::PathCreation(_, _) => {
                ("INTERNAL_PATH", "permanent")
            }
            AppError::Io(_) => ("IO_ERROR", "transient"),
            AppError::InvalidState(_) => ("INVALID_STATE", "permanent"),
            AppError::Internal(_) => ("INTERNAL_ERROR", "permanent"),
        };
        SerializableError {
            code: code.to_string(),
            category: category.to_string(),
            message: err.to_string(),
            details: None,
        }
    }
}

impl serde::Serialize for AppError {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let s: SerializableError = self.clone().into();
        s.serialize(serializer)
    }
}

// Clone is required for the From conversion above
impl Clone for AppError {
    fn clone(&self) -> Self {
        match self {
            Self::PathResolution(s) => Self::PathResolution(s.clone()),
            Self::PathCreation(p, s) => Self::PathCreation(p.clone(), s.clone()),
            Self::Io(e) => Self::Io(std::io::Error::new(e.kind(), e.to_string())),
            Self::Database(s) => Self::Database(s.clone()),
            Self::Crypto(s) => Self::Crypto(s.clone()),
            Self::Module(s) => Self::Module(s.clone()),
            Self::Network(s) => Self::Network(s.clone()),
            Self::PermissionDenied(s) => Self::PermissionDenied(s.clone()),
            Self::NotFound(s) => Self::NotFound(s.clone()),
            Self::Conflict(s) => Self::Conflict(s.clone()),
            Self::InvalidState(s) => Self::InvalidState(s.clone()),
            Self::Validation(s) => Self::Validation(s.clone()),
            Self::Internal(s) => Self::Internal(s.clone()),
        }
    }
}

pub type AppResult<T> = std::result::Result<T, AppError>;
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/error.rs || { echo "FAIL"; exit 1; }
grep -q "SerializableError" apps/admin/src-tauri/src/error.rs || { echo "FAIL"; exit 1; }
grep -q "VALIDATION_FAILED" apps/admin/src-tauri/src/error.rs || { echo "FAIL: no code"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL: cargo check"; exit 1; }
echo "OK"
```
