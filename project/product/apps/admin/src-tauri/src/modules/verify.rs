use base64::{engine::general_purpose::STANDARD as B64, Engine as _};
use ed25519_dalek::{Signature, Verifier, VerifyingKey};
use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize};
use sha2::Sha256;

use crate::error::{AppError, AppResult};

type HmacSha256 = Hmac<Sha256>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModuleSignature {
    pub cloud_root: SignaturePart,
    pub project_license: LicenseSignature,
    pub device_bind: DeviceBindMac,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignaturePart {
    /// Base64 Ed25519 signature over the cloud_root message.
    pub signature: String,
    /// Base64 Ed25519 public key. Pinned by the manifest; the Admin trusts
    /// it only if it matches the platform root key (or, pre-release, whatever
    /// the Cloud reports).
    pub public_key: String,
    pub algorithm: String,
    pub signed_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LicenseSignature {
    pub signature: String,
    pub project_id: String,
    pub plan_id: String,
    pub algorithm: String,
    pub signed_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceBindMac {
    /// Hex HMAC-SHA256 over the device_bind message.
    pub signature: String,
    pub device_id: String,
    pub algorithm: String,
    pub signed_at: String,
}

// ---------------------------------------------------------------------------
// Canonical messages
//
// Each message is a length-prefixed, version-tagged byte string. The tag
// prevents cross-protocol confusion (a signature over one message cannot be
// replayed as a signature over another).
// ---------------------------------------------------------------------------

pub fn cloud_root_message(manifest_sha256_hex: &str, module_id: &str, version: &str) -> Vec<u8> {
    let mut out = Vec::new();
    out.extend_from_slice(b"module.cloud_root.v1\n");
    out.extend_from_slice(manifest_sha256_hex.as_bytes());
    out.push(b'\n');
    out.extend_from_slice(module_id.as_bytes());
    out.push(b'\n');
    out.extend_from_slice(version.as_bytes());
    out
}

pub fn project_license_message(
    module_id: &str,
    version: &str,
    project_id: &str,
    plan_id: &str,
) -> Vec<u8> {
    let mut out = Vec::new();
    out.extend_from_slice(b"module.project_license.v1\n");
    out.extend_from_slice(module_id.as_bytes());
    out.push(b'\n');
    out.extend_from_slice(version.as_bytes());
    out.push(b'\n');
    out.extend_from_slice(project_id.as_bytes());
    out.push(b'\n');
    out.extend_from_slice(plan_id.as_bytes());
    out
}

pub fn device_bind_message(module_id: &str, version: &str, device_id: &str) -> Vec<u8> {
    let mut out = Vec::new();
    out.extend_from_slice(b"module.device_bind.v1\n");
    out.extend_from_slice(module_id.as_bytes());
    out.push(b'\n');
    out.extend_from_slice(version.as_bytes());
    out.push(b'\n');
    out.extend_from_slice(device_id.as_bytes());
    out
}

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

pub fn verify_ed25519(public_key_b64: &str, message: &[u8], signature_b64: &str) -> AppResult<()> {
    let pk_bytes = B64
        .decode(public_key_b64)
        .map_err(|e| AppError::Crypto(format!("public key b64: {e}")))?;
    let sig_bytes = B64
        .decode(signature_b64)
        .map_err(|e| AppError::Crypto(format!("signature b64: {e}")))?;
    if pk_bytes.len() != 32 {
        return Err(AppError::Crypto(format!(
            "public key must be 32 bytes, got {}",
            pk_bytes.len()
        )));
    }
    if sig_bytes.len() != 64 {
        return Err(AppError::Crypto(format!(
            "signature must be 64 bytes, got {}",
            sig_bytes.len()
        )));
    }
    let mut pk_arr = [0u8; 32];
    pk_arr.copy_from_slice(&pk_bytes);
    let pk = VerifyingKey::from_bytes(&pk_arr)
        .map_err(|e| AppError::Crypto(format!("verifying key: {e}")))?;
    let mut sig_arr = [0u8; 64];
    sig_arr.copy_from_slice(&sig_bytes);
    let sig = Signature::from_bytes(&sig_arr);
    pk.verify(message, &sig)
        .map_err(|e| AppError::Crypto(format!("ed25519 verify failed: {e}")))
}

pub fn verify_hmac_sha256(secret: &[u8], message: &[u8], expected_hex: &str) -> AppResult<()> {
    let mut mac = HmacSha256::new_from_slice(secret)
        .map_err(|e| AppError::Crypto(format!("hmac init: {e}")))?;
    mac.update(message);
    let got = hex::encode(mac.finalize().into_bytes());
    if got != expected_hex.to_lowercase() {
        return Err(AppError::Crypto("hmac mismatch".into()));
    }
    Ok(())
}

// ---------------------------------------------------------------------------
// Composite verification
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum VerifyError {
    ManifestHash,
    CloudRoot,
    ProjectLicense,
    DeviceBind,
}

impl std::fmt::Display for VerifyError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            VerifyError::ManifestHash => write!(f, "manifest hash mismatch"),
            VerifyError::CloudRoot => write!(f, "cloud root signature invalid"),
            VerifyError::ProjectLicense => write!(f, "project license signature invalid"),
            VerifyError::DeviceBind => write!(f, "device bind MAC invalid"),
        }
    }
}

pub struct VerifyContext<'a> {
    pub module_id: &'a str,
    pub version: &'a str,
    pub manifest_sha256_hex: &'a str,
    pub project_id: &'a str,
    pub plan_id: &'a str,
    pub device_id: &'a str,
    pub device_bind_key: &'a [u8],
}

/// Run all three signature checks. Fails on the first one that does not pass.
pub fn verify_all(ctx: &VerifyContext<'_>, sigs: &ModuleSignature) -> Result<(), VerifyError> {
    // 1. Cloud root (Ed25519) — proves authorship
    let root_msg = cloud_root_message(ctx.manifest_sha256_hex, ctx.module_id, ctx.version);
    verify_ed25519(&sigs.cloud_root.public_key, &root_msg, &sigs.cloud_root.signature)
        .map_err(|_| VerifyError::CloudRoot)?;

    // 2. Project license (Ed25519) — proves entitlement
    let lic_msg = project_license_message(
        ctx.module_id,
        ctx.version,
        ctx.project_id,
        ctx.plan_id,
    );
    verify_ed25519(&sigs.cloud_root.public_key, &lic_msg, &sigs.project_license.signature)
        .map_err(|_| VerifyError::ProjectLicense)?;

    // 3. Device bind (HMAC-SHA256) — proves this device was licensed
    let bind_msg = device_bind_message(ctx.module_id, ctx.version, ctx.device_id);
    verify_hmac_sha256(ctx.device_bind_key, &bind_msg, &sigs.device_bind.signature)
        .map_err(|_| VerifyError::DeviceBind)?;

    Ok(())
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use ed25519_dalek::{Signer, SigningKey};
    use rand::rngs::OsRng;
    use sha2::{Digest, Sha256 as Sha256Hasher};

    fn sign_ed25519(signing: &SigningKey, msg: &[u8]) -> String {
        B64.encode(signing.sign(msg).to_bytes())
    }

    fn pk_b64(signing: &SigningKey) -> String {
        B64.encode(signing.verifying_key().to_bytes())
    }

    fn sha256_hex(data: &[u8]) -> String {
        hex::encode(Sha256Hasher::digest(data))
    }

    fn hmac_hex(key: &[u8], msg: &[u8]) -> String {
        let mut mac = HmacSha256::new_from_slice(key).unwrap();
        mac.update(msg);
        hex::encode(mac.finalize().into_bytes())
    }

    #[test]
    fn cloud_root_roundtrip() {
        let signing = SigningKey::generate(&mut OsRng);
        let msg = cloud_root_message("abc", "medical-reception", "1.0.0");
        let sig = sign_ed25519(&signing, &msg);
        verify_ed25519(&pk_b64(&signing), &msg, &sig).unwrap();
    }

    #[test]
    fn cloud_root_rejects_tampered() {
        let signing = SigningKey::generate(&mut OsRng);
        let msg = cloud_root_message("abc", "medical-reception", "1.0.0");
        let sig = sign_ed25519(&signing, &msg);
        let bad = cloud_root_message("abc", "medical-reception", "1.0.1");
        assert!(verify_ed25519(&pk_b64(&signing), &bad, &sig).is_err());
    }

    #[test]
    fn hmac_roundtrip() {
        let key = b"device-bind-key-32-bytes-long!";
        let msg = device_bind_message("medical-reception", "1.0.0", "dev-1");
        let mac = hmac_hex(key, &msg);
        verify_hmac_sha256(key, &msg, &mac).unwrap();
    }

    #[test]
    fn hmac_rejects_wrong_key() {
        let key = b"device-bind-key-32-bytes-long!";
        let bad = b"wrong-key-32-bytes-long!!!!!";
        let msg = device_bind_message("medical-reception", "1.0.0", "dev-1");
        let mac = hmac_hex(key, &msg);
        assert!(verify_hmac_sha256(bad, &msg, &mac).is_err());
    }

    fn build_signatures(
        signing: &SigningKey,
        device_key: &[u8],
        manifest_sha: &str,
        module_id: &str,
        version: &str,
        project_id: &str,
        plan_id: &str,
        device_id: &str,
    ) -> ModuleSignature {
        ModuleSignature {
            cloud_root: SignaturePart {
                signature: sign_ed25519(
                    signing,
                    &cloud_root_message(manifest_sha, module_id, version),
                ),
                public_key: pk_b64(signing),
                algorithm: "ed25519".into(),
                signed_at: "2026-01-01T00:00:00Z".into(),
            },
            project_license: LicenseSignature {
                signature: sign_ed25519(
                    signing,
                    &project_license_message(module_id, version, project_id, plan_id),
                ),
                project_id: project_id.into(),
                plan_id: plan_id.into(),
                algorithm: "ed25519".into(),
                signed_at: "2026-01-01T00:00:00Z".into(),
            },
            device_bind: DeviceBindMac {
                signature: hmac_hex(
                    device_key,
                    &device_bind_message(module_id, version, device_id),
                ),
                device_id: device_id.into(),
                algorithm: "hmac-sha256".into(),
                signed_at: "2026-01-01T00:00:00Z".into(),
            },
        }
    }

    #[test]
    fn verify_all_passes_with_matching_signatures() {
        let signing = SigningKey::generate(&mut OsRng);
        let device_key = b"device-bind-key-32-bytes-long!";
        let manifest_sha = sha256_hex(b"fake manifest bytes");
        let ctx = VerifyContext {
            module_id: "medical-reception",
            version: "1.0.0",
            manifest_sha256_hex: &manifest_sha,
            project_id: "proj-1",
            plan_id: "team",
            device_id: "dev-1",
            device_bind_key: device_key,
        };
        let sigs = build_signatures(
            &signing, device_key, &manifest_sha,
            "medical-reception", "1.0.0", "proj-1", "team", "dev-1",
        );
        verify_all(&ctx, &sigs).unwrap();
    }

    #[test]
    fn verify_all_rejects_wrong_device() {
        let signing = SigningKey::generate(&mut OsRng);
        let device_key = b"device-bind-key-32-bytes-long!";
        let manifest_sha = sha256_hex(b"fake manifest bytes");
        let ctx = VerifyContext {
            module_id: "medical-reception",
            version: "1.0.0",
            manifest_sha256_hex: &manifest_sha,
            project_id: "proj-1",
            plan_id: "team",
            device_id: "dev-2",
            device_bind_key: device_key,
        };
        let sigs = build_signatures(
            &signing, device_key, &manifest_sha,
            "medical-reception", "1.0.0", "proj-1", "team", "dev-1",
        );
        assert_eq!(verify_all(&ctx, &sigs), Err(VerifyError::DeviceBind));
    }

    #[test]
    fn verify_all_rejects_wrong_plan() {
        let signing = SigningKey::generate(&mut OsRng);
        let device_key = b"device-bind-key-32-bytes-long!";
        let manifest_sha = sha256_hex(b"fake manifest bytes");
        let ctx = VerifyContext {
            module_id: "medical-reception",
            version: "1.0.0",
            manifest_sha256_hex: &manifest_sha,
            project_id: "proj-1",
            plan_id: "enterprise",
            device_id: "dev-1",
            device_bind_key: device_key,
        };
        let sigs = build_signatures(
            &signing, device_key, &manifest_sha,
            "medical-reception", "1.0.0", "proj-1", "team", "dev-1",
        );
        assert_eq!(verify_all(&ctx, &sigs), Err(VerifyError::ProjectLicense));
    }

    #[test]
    fn verify_all_rejects_tampered_manifest() {
        let signing = SigningKey::generate(&mut OsRng);
        let device_key = b"device-bind-key-32-bytes-long!";
        let signed_sha = sha256_hex(b"original manifest bytes");
        let tampered_sha = sha256_hex(b"tampered manifest bytes");
        let ctx = VerifyContext {
            module_id: "medical-reception",
            version: "1.0.0",
            manifest_sha256_hex: &tampered_sha,
            project_id: "proj-1",
            plan_id: "team",
            device_id: "dev-1",
            device_bind_key: device_key,
        };
        let sigs = build_signatures(
            &signing, device_key, &signed_sha,
            "medical-reception", "1.0.0", "proj-1", "team", "dev-1",
        );
        assert_eq!(verify_all(&ctx, &sigs), Err(VerifyError::CloudRoot));
    }
}