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

impl From<serde_json::Error> for AppError {
    fn from(e: serde_json::Error) -> Self { AppError::Internal(e.to_string()) }
}

impl From<tauri::Error> for AppError {
    fn from(e: tauri::Error) -> Self { AppError::Internal(e.to_string()) }
}
