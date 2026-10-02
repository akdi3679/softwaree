use std::path::Path;
use serde::{Deserialize, Serialize};
use base64::{Engine, engine::general_purpose::STANDARD as B64};
use crate::crypto::device_key::DeviceKey;
use crate::error::{AppError, AppResult};

const DEVICE_IDENTITY_FILE: &str = "device_identity.json";

#[derive(Debug, Serialize, Deserialize)]
pub struct DeviceIdentityRecord {
    pub private_key_b64: String,
    pub public_key_b64: String,
    pub device_id: Option<String>,
    pub created_at: String,
}

impl DeviceIdentityRecord {
    pub fn load_or_create(keys_dir: &Path) -> AppResult<(DeviceKey, Self)> {
        let path = keys_dir.join(DEVICE_IDENTITY_FILE);
        if path.exists() {
            let s = std::fs::read_to_string(&path)?;
            let record: Self = serde_json::from_str(&s)
                .map_err(|e| AppError::Crypto(format!("device identity corrupt: {e}")))?;
            let pk_bytes = B64.decode(&record.private_key_b64)
                .map_err(|e| AppError::Crypto(format!("base64 decode: {e}")))?;
            let key = DeviceKey::from_bytes(&pk_bytes)?;
            Ok((key, record))
        } else {
            let key = DeviceKey::generate();
            let record = Self {
                private_key_b64: B64.encode(key.sign_bytes()),
                public_key_b64: key.public_key_b64(),
                device_id: None,
                created_at: chrono::Utc::now().to_rfc3339(),
            };
            let json = serde_json::to_string_pretty(&record)?;
            std::fs::write(&path, json)?;
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let mut perms = std::fs::metadata(&path)?.permissions();
                perms.set_mode(0o600);
                std::fs::set_permissions(&path, perms)?;
            }
            Ok((key, record))
        }
    }
}
