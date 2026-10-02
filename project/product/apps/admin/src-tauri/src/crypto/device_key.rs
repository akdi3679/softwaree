use ed25519_dalek::{SigningKey, VerifyingKey, Signature, Signer, Verifier};
use rand::rngs::OsRng;
use base64::{Engine, engine::general_purpose::STANDARD as B64};
use crate::error::{AppError, AppResult};

pub struct DeviceKey {
    signing: SigningKey,
}

impl DeviceKey {
    pub fn generate() -> Self {
        let mut csprng = OsRng;
        let signing = SigningKey::generate(&mut csprng);
        Self { signing }
    }

    pub fn from_bytes(bytes: &[u8]) -> AppResult<Self> {
        if bytes.len() != 32 {
            return Err(AppError::Crypto(format!("invalid key length: {}", bytes.len())));
        }
        let mut arr = [0u8; 32];
        arr.copy_from_slice(bytes);
        let signing = SigningKey::from_bytes(&arr);
        Ok(Self { signing })
    }

    pub fn public_key_bytes(&self) -> [u8; 32] {
        self.signing.verifying_key().to_bytes()
    }

    pub fn public_key_b64(&self) -> String {
        B64.encode(self.public_key_bytes())
    }

    pub fn sign(&self, message: &[u8]) -> [u8; 64] {
        let sig = self.signing.sign(message);
        sig.to_bytes()
    }

    pub fn sign_bytes(&self) -> [u8; 32] {
        self.signing.to_bytes()
    }

    pub fn verify(public_key: &[u8], message: &[u8], signature: &[u8]) -> AppResult<()> {
        if public_key.len() != 32 {
            return Err(AppError::Crypto("invalid public key length".into()));
        }
        if signature.len() != 64 {
            return Err(AppError::Crypto("invalid signature length".into()));
        }
        let mut pk_arr = [0u8; 32];
        pk_arr.copy_from_slice(public_key);
        let mut sig_arr = [0u8; 64];
        sig_arr.copy_from_slice(signature);
        let pk = VerifyingKey::from_bytes(&pk_arr)
            .map_err(|e| AppError::Crypto(format!("invalid public key: {e}")))?;
        let sig = Signature::from_bytes(&sig_arr);
        pk.verify(message, &sig)
            .map_err(|e| AppError::Crypto(format!("verify failed: {e}")))?;
        Ok(())
    }
}
