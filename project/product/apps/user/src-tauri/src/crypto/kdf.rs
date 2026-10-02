use hkdf::Hkdf;
use sha2::Sha256;
use crate::error::{AppError, AppResult};

pub fn derive(device_bytes: &[u8], info: &[u8], out: &mut [u8]) -> AppResult<()> {
    let hk = Hkdf::<Sha256>::new(None, device_bytes);
    hk.expand(info, out)
        .map_err(|e| AppError::Crypto(format!("hkdf: {e}")))
}
