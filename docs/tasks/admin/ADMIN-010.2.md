# TASK ID: ADMIN-010.2
# TITLE: Add backup encryption (AES-GCM with Argon2-derived key)
# STATUS: pending
# DEPENDENCIES: ADMIN-010.1
# ALLOWED FILES: product/apps/admin/src-tauri/src/backup/crypto.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Encrypt backup snapshots with AES-256-GCM using a key derived from the Admin's device key + project pass-phrase.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/backup/crypto.rs`:

```rust
use aes_gcm::{Aes256Gcm, Nonce, KeyInit, aead::Aead};
use argon2::{Argon2, Algorithm, Version, Params};
use base64::Engine;
use base64::engine::general_purpose::STANDARD as B64;
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

/// Encrypt a database snapshot. Key derived from device_key + passphrase.
pub fn encrypt(
    plaintext: &[u8],
    device_key_bytes: &[u8],
    passphrase: &str,
) -> AppResult<EncryptedBackup> {
    // Generate salt + nonce
    let mut rng = rand::thread_rng();
    let mut salt = [0u8; SALT_LEN];
    rng.fill_bytes(&mut salt);
    let mut nonce = [0u8; NONCE_LEN];
    rng.fill_bytes(&mut nonce);

    // Derive key: HKDF over (argon2(passphrase + salt) || device_key_bytes)
    let argon2 = Argon2::new(
        Algorithm::Argon2id,
        Version::V0x13,
        Params::new(64 * 1024, 3, 4, Some(64))?,
    );
    let mut pass_key = [0u8; 64];
    argon2.hash_password_into(
        passphrase.as_bytes(),
        &salt,
        &mut pass_key,
    )
    .map_err(|e| AppError::Crypto(format!("argon2: {e}")))?;

    // Combine with device key via HKDF
    let hkdf = Hkdf::<Sha256>::new(Some(&salt), &pass_key);
    let mut key = [0u8; 32];
    hkdf.expand(device_key_bytes, &mut key)
        .map_err(|e| AppError::Crypto(format!("hkdf: {e}")))?;

    // AES-GCM encrypt
    let cipher = Aes256Gcm::new(&key.into());
    let cipher_nonce = Nonce::from_slice(&nonce);
    let ciphertext = cipher
        .encrypt(cipher_nonce, plaintext)
        .map_err(|e| AppError::Crypto(format!("encrypt: {e}")))?;

    Ok(EncryptedBackup {
        ciphertext,
        nonce,
        salt,
        version: BACKUP_CRYPTO_VERSION,
    })
}

/// Decrypt an EncryptedBackup.
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
    cipher
        .decrypt(cipher_nonce, backup.ciphertext.as_ref())
        .map_err(|e| AppError::Crypto(format!("decrypt: {e}")))
}
```

Add to Cargo.toml:
```toml
aes-gcm = "0.10"
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/backup/crypto.rs || { echo "FAIL"; exit 1; }
grep -q "fn encrypt" apps/admin/src-tauri/src/backup/crypto.rs || { echo "FAIL"; exit 1; }
grep -q "fn decrypt" apps/admin/src-tauri/src/backup/crypto.rs || { echo "FAIL: no decrypt"; exit 1; }
grep -q "aes-gcm" apps/admin/src-tauri/Cargo.toml || { echo "FAIL: no aes-gcm"; exit 1; }
cd apps/admin/src-tauri && cargo check --quiet 2>&1 | tail -5 || { echo "FAIL"; exit 1; }
echo "OK"
```
