use hkdf::Hkdf;
use sha2::Sha256;
use crate::error::{AppError, AppResult};

pub mod info {
    pub const PROJECT_DB_ENCRYPTION: &[u8] = b"project-db-encryption-v1";
    pub const BACKUP_ENCRYPTION: &[u8] = b"backup-encryption-v1";
    pub const DEVICE_BIND: &[u8] = b"device-bind-key-v1";
}

pub fn derive(ikm: &[u8], salt: &[u8], info: &[u8], output_len: usize) -> AppResult<Vec<u8>> {
    let hk = Hkdf::<Sha256>::new(Some(salt), ikm);
    let mut okm = vec![0u8; output_len];
    hk.expand(info, &mut okm)
        .map_err(|e| AppError::Crypto(format!("hkdf expand failed: {e}")))?;
    Ok(okm)
}

pub fn derive_32(ikm: &[u8], salt: &[u8], info: &[u8]) -> AppResult<[u8; 32]> {
    let v = derive(ikm, salt, info, 32)?;
    let mut out = [0u8; 32];
    out.copy_from_slice(&v);
    Ok(out)
}
