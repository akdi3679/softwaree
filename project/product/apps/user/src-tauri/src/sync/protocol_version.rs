use serde::{Deserialize, Serialize};

use crate::error::{AppError, AppResult};

pub const SUPPORTED: &[u32] = &[1];
pub const CURRENT: u32 = 1;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncHello {
    pub protocol_version: u32,
    pub user_id: String,
    pub device_id: String,
    pub project_id: String,
    pub device_pubkey: String,
    pub device_signature: String,
}

pub fn negotiate(hello: &SyncHello) -> AppResult<u32> {
    if !SUPPORTED.contains(&hello.protocol_version) {
        return Err(AppError::Internal(format!(
            "protocol version {} not supported; current is {}",
            hello.protocol_version, CURRENT
        )));
    }
    Ok(hello.protocol_version)
}
