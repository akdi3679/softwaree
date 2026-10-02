use base64::Engine;
use base64::engine::general_purpose::URL_SAFE_NO_PAD as B64;
use ed25519_dalek::{Signer, SigningKey, Verifier, VerifyingKey, Signature};
use rand::RngCore;

use crate::error::AppResult;

#[derive(Clone)]
pub struct DeviceKey {
    pub signing: SigningKey,
}

impl DeviceKey {
    pub fn generate() -> Self {
        let mut bytes = [0u8; 32];
        rand::thread_rng().fill_bytes(&mut bytes);
        Self { signing: SigningKey::from_bytes(&bytes) }
    }

    pub fn from_bytes(bytes: &[u8; 32]) -> Self {
        Self { signing: SigningKey::from_bytes(bytes) }
    }

    pub fn public_key_bytes(&self) -> [u8; 32] {
        self.signing.verifying_key().to_bytes()
    }

    pub fn public_key_b64(&self) -> String {
        B64.encode(self.public_key_bytes())
    }

    pub fn sign(&self, msg: &[u8]) -> Vec<u8> {
        self.signing.sign(msg).to_bytes().to_vec()
    }

    pub fn sign_bytes(&self) -> [u8; 32] {
        self.signing.to_bytes()
    }

    pub fn verify(public_key: &[u8], msg: &[u8], signature: &[u8]) -> AppResult<()> {
        if public_key.len() != 32 {
            return Err(crate::error::AppError::Crypto("invalid public key length".into()));
        }
        let mut pk_bytes = [0u8; 32];
        pk_bytes.copy_from_slice(public_key);
        let pk = VerifyingKey::from_bytes(&pk_bytes)?;
        let sig_arr: [u8; 64] = signature.try_into()
            .map_err(|_| crate::error::AppError::Crypto("signature must be 64 bytes".into()))?;
        let sig = Signature::from_bytes(&sig_arr);
        pk.verify(msg, &sig)?;
        Ok(())
    }
}
