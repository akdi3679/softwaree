use ed25519_dalek::{SigningKey, VerifyingKey, Signer};
use rand::RngCore;
use std::path::Path;

use crate::error::{AppError, AppResult};

const SECRET_KEY_LENGTH: usize = 32;

#[derive(serde::Serialize)]
pub struct NewDeviceKey {
    pub public_key_hex: String,
    pub rotation_proof: String,
    pub old_public_key_hex: String,
}

/// Rotate the device key on disk. Reads the current key, generates a new one,
/// signs the new public key with the old private key (proof of continuity),
/// writes the new key to disk, and returns the proof.
///
/// The caller is responsible for notifying the Cloud of the rotation.
pub async fn rotate_device_key(key_path: &Path) -> AppResult<NewDeviceKey> {
    let old_bytes = tokio::fs::read(key_path)
        .await
        .map_err(AppError::Io)?;
    let old_arr: [u8; SECRET_KEY_LENGTH] = old_bytes
        .as_slice()
        .try_into()
        .map_err(|_| AppError::Crypto("stored key is not 32 bytes".into()))?;
    let old_signing = SigningKey::from_bytes(&old_arr);
    let old_verifying = old_signing.verifying_key();

    let mut new_bytes = [0u8; SECRET_KEY_LENGTH];
    rand::thread_rng().fill_bytes(&mut new_bytes);
    let new_signing = SigningKey::from_bytes(&new_bytes);
    let new_verifying: VerifyingKey = new_signing.verifying_key();
    let proof = old_signing.sign(new_verifying.as_bytes());

    tokio::fs::write(key_path, new_signing.to_bytes())
        .await
        .map_err(AppError::Io)?;

    Ok(NewDeviceKey {
        public_key_hex: hex::encode(new_verifying.as_bytes()),
        rotation_proof: hex::encode(proof.to_bytes()),
        old_public_key_hex: hex::encode(old_verifying.as_bytes()),
    })
}
