use ed25519_dalek::Signer;
use zeroize::Zeroize;

/// Ed25519 secret key material that zeroes on drop.
pub struct SecretKey {
    bytes: [u8; 32],
}

impl SecretKey {
    pub fn from_bytes(b: [u8; 32]) -> Self {
        Self { bytes: b }
    }

    pub fn as_bytes(&self) -> &[u8; 32] {
        &self.bytes
    }

    pub fn sign(&self, msg: &[u8]) -> ed25519_dalek::Signature {
        let sk = ed25519_dalek::SigningKey::from_bytes(&self.bytes);
        sk.sign(msg)
    }
}

impl Drop for SecretKey {
    fn drop(&mut self) {
        self.bytes.zeroize();
    }
}
