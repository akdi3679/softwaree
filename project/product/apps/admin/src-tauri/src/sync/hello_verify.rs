use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use ed25519_dalek::{Signature, Verifier, VerifyingKey};

use crate::error::{AppError, AppResult};

/// Canonical bytes the client signs for a "hello".
/// Signature input = "hello" || protocol_version || user_id || project_id
pub fn hello_signing_bytes(protocol_version: u32, user_id: &str, project_id: &str) -> Vec<u8> {
    format!("hello{}{}{}", protocol_version, user_id, project_id).into_bytes()
}

pub fn verify_hello_signature(
    device_pubkey_b64: &str,
    device_signature_b64: &str,
    protocol_version: u32,
    user_id: &str,
    project_id: &str,
) -> AppResult<()> {
    let pubkey_bytes = BASE64
        .decode(device_pubkey_b64)
        .map_err(|e| AppError::Protocol(format!("pubkey base64: {e}")))?;
    let sig_bytes = BASE64
        .decode(device_signature_b64)
        .map_err(|e| AppError::Protocol(format!("signature base64: {e}")))?;

    let pubkey_arr: [u8; 32] = pubkey_bytes
        .as_slice()
        .try_into()
        .map_err(|_| AppError::Protocol("pubkey must be 32 bytes".into()))?;
    let verifying_key = VerifyingKey::from_bytes(&pubkey_arr)
        .map_err(|e| AppError::Protocol(format!("invalid pubkey: {e}")))?;

    let sig_arr: [u8; 64] = sig_bytes
        .as_slice()
        .try_into()
        .map_err(|_| AppError::Protocol("signature must be 64 bytes".into()))?;
    let signature = Signature::from_bytes(&sig_arr);

    let bytes = hello_signing_bytes(protocol_version, user_id, project_id);
    verifying_key
        .verify(&bytes, &signature)
        .map_err(|_| AppError::Protocol("hello signature verification failed".into()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use ed25519_dalek::{Signer, SigningKey};
    use rand::rngs::OsRng;

    fn sign(signing: &SigningKey, msg: &[u8]) -> String {
        BASE64.encode(signing.sign(msg).to_bytes())
    }

    fn pk(signing: &SigningKey) -> String {
        BASE64.encode(signing.verifying_key().to_bytes())
    }

    #[test]
    fn verifies_valid_signature() {
        let signing = SigningKey::generate(&mut OsRng);
        let msg = hello_signing_bytes(1, "user-1", "proj-1");
        let sig = sign(&signing, &msg);
        verify_hello_signature(&pk(&signing), &sig, 1, "user-1", "proj-1").unwrap();
    }

    #[test]
    fn rejects_wrong_user() {
        let signing = SigningKey::generate(&mut OsRng);
        let msg = hello_signing_bytes(1, "user-1", "proj-1");
        let sig = sign(&signing, &msg);
        assert!(verify_hello_signature(&pk(&signing), &sig, 1, "user-2", "proj-1").is_err());
    }

    #[test]
    fn rejects_wrong_protocol_version() {
        let signing = SigningKey::generate(&mut OsRng);
        let msg = hello_signing_bytes(1, "user-1", "proj-1");
        let sig = sign(&signing, &msg);
        assert!(verify_hello_signature(&pk(&signing), &sig, 2, "user-1", "proj-1").is_err());
    }
}