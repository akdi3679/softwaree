use ed25519_dalek::{Signature, Verifier, VerifyingKey};

use crate::error::{AppError, AppResult};

pub fn verify_admin_signature(
    admin_public_key: &[u8; 32],
    message: &[u8],
    signature: &[u8; 64],
) -> AppResult<()> {
    let pk = VerifyingKey::from_bytes(admin_public_key)
        .map_err(|e| AppError::Crypto(e.to_string()))?;
    let sig = Signature::from_bytes(signature);
    pk.verify(message, &sig)
        .map_err(|e| AppError::Auth(format!("signature invalid: {e}")))?;
    Ok(())
}
