use std::path::Path;
use rand::RngCore;

use crate::crypto::device_key::DeviceKey;
use crate::error::{AppError, AppResult};

const DEVICE_KEY_FILE: &str = "device.key";

pub fn load_or_create(keys_dir: &Path) -> AppResult<DeviceKey> {
    let key_path = keys_dir.join(DEVICE_KEY_FILE);
    if key_path.exists() {
        let bytes = std::fs::read(&key_path)?;
        if bytes.len() != 32 {
            return Err(AppError::Crypto(format!("device key wrong length: {}", bytes.len())));
        }
        let mut arr = [0u8; 32];
        arr.copy_from_slice(&bytes);
        Ok(DeviceKey::from_bytes(&arr))
    } else {
        std::fs::create_dir_all(keys_dir)?;
        let key = DeviceKey::generate();
        std::fs::write(&key_path, key.sign_bytes())?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&key_path, std::fs::Permissions::from_mode(0o600))?;
        }
        Ok(key)
    }
}
