use aes_gcm::{Aes256Gcm, Nonce, KeyInit, aead::Aead};
use argon2::{Argon2, Algorithm, Version, Params};
use rand::RngCore;
use sha2::Sha256;
use hkdf::Hkdf;

use crate::error::{AppError, AppResult};

const NONCE_LEN: usize = 12;
const SALT_LEN: usize = 32;

pub struct EncryptedBackup {
    pub ciphertext: Vec<u8>,
    pub nonce: [u8; NONCE_LEN],
    pub salt: [u8; SALT_LEN],
    pub version: u8,
}

pub const BACKUP_CRYPTO_VERSION: u8 = 1;

pub fn encrypt(
    plaintext: &[u8],
    device_key_bytes: &[u8],
    passphrase: &str,
) -> AppResult<EncryptedBackup> {
    let mut rng = rand::thread_rng();
    let mut salt = [0u8; SALT_LEN];
    rng.fill_bytes(&mut salt);
    let mut nonce = [0u8; NONCE_LEN];
    rng.fill_bytes(&mut nonce);

    let argon2 = Argon2::new(
        Algorithm::Argon2id,
        Version::V0x13,
        Params::new(64 * 1024, 3, 4, Some(64))?,
    );
    let mut pass_key = [0u8; 64];
    argon2.hash_password_into(passphrase.as_bytes(), &salt, &mut pass_key)
        .map_err(|e| AppError::Crypto(format!("argon2: {e}")))?;

    let hkdf = Hkdf::<Sha256>::new(Some(&salt), &pass_key);
    let mut key = [0u8; 32];
    hkdf.expand(device_key_bytes, &mut key)
        .map_err(|e| AppError::Crypto(format!("hkdf: {e}")))?;

    let cipher = Aes256Gcm::new(&key.into());
    let cipher_nonce = Nonce::from_slice(&nonce);
    let ciphertext = cipher.encrypt(cipher_nonce, plaintext)
        .map_err(|e| AppError::Crypto(format!("encrypt: {e}")))?;

    Ok(EncryptedBackup { ciphertext, nonce, salt, version: BACKUP_CRYPTO_VERSION })
}

pub fn decrypt(
    backup: &EncryptedBackup,
    device_key_bytes: &[u8],
    passphrase: &str,
) -> AppResult<Vec<u8>> {
    let argon2 = Argon2::new(
        Algorithm::Argon2id,
        Version::V0x13,
        Params::new(64 * 1024, 3, 4, Some(64))?,
    );
    let mut pass_key = [0u8; 64];
    argon2.hash_password_into(passphrase.as_bytes(), &backup.salt, &mut pass_key)
        .map_err(|e| AppError::Crypto(format!("argon2: {e}")))?;

    let hkdf = Hkdf::<Sha256>::new(Some(&backup.salt), &pass_key);
    let mut key = [0u8; 32];
    hkdf.expand(device_key_bytes, &mut key)
        .map_err(|e| AppError::Crypto(format!("hkdf: {e}")))?;

    let cipher = Aes256Gcm::new(&key.into());
    let cipher_nonce = Nonce::from_slice(&backup.nonce);
    cipher.decrypt(cipher_nonce, backup.ciphertext.as_ref())
        .map_err(|e| AppError::Crypto(format!("decrypt: {e}")))
}
