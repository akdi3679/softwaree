use serde::{Deserialize, Serialize};
use totp_rs::{Algorithm, Secret, TOTP};

use crate::error::{AppError, AppResult};

/// Default TOTP parameters. RFC 6238 recommends 30s step, 6 digits, SHA1.
/// We bump skew to 1 (accept the previous and next step) to tolerate clock
/// drift on customer devices.
const DEFAULT_DIGITS: usize = 6;
const DEFAULT_SKEW: u8 = 1;
const DEFAULT_STEP_SECS: u64 = 30;
const DEFAULT_ISSUER: &str = "Product";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TotpSetup {
    /// Base32 secret (no padding). Store this on the account.
    pub secret_base32: String,
    /// otpauth:// URI. Render as QR code for the user's authenticator app.
    pub otpauth_url: String,
}

/// Generate a fresh TOTP secret and the matching otpauth URI.
///
/// The secret is not persisted here. The caller is responsible for storing
/// `secret_base32` on the account (in the Cloud, once C4b ships) and for
/// calling `verify_code` before marking it active.
pub fn generate_setup(account_name: &str) -> AppResult<TotpSetup> {
    let secret = Secret::generate_secret();
    let secret_bytes = secret
        .to_bytes()
        .map_err(|e| AppError::Crypto(format!("totp secret bytes: {e}")))?;

    let totp = TOTP::new(
        Algorithm::SHA1,
        DEFAULT_DIGITS,
        DEFAULT_SKEW,
        DEFAULT_STEP_SECS,
        secret_bytes,
        Some(DEFAULT_ISSUER.to_string()),
        account_name.to_string(),
    )
    .map_err(|e| AppError::Crypto(format!("totp new: {e}")))?;

    Ok(TotpSetup {
        secret_base32: totp.get_secret_base32(),
        otpauth_url: totp.get_url(),
    })
}

/// Verify a 6-digit code against a base32 secret at the current time.
///
/// Accepts the previous step, current step, and next step (skew = 1).
/// Returns `Ok(true)` if the code matches any of them, `Ok(false)` otherwise.
pub fn verify_code(secret_base32: &str, code: &str) -> AppResult<bool> {
    // Base32 secret as stored. `Secret::Encoded` parses the base32 text.
    let secret = Secret::Encoded(secret_base32.to_string());
    let secret_bytes = secret
        .to_bytes()
        .map_err(|e| AppError::Crypto(format!("totp decode secret: {e}")))?;

    let totp = TOTP::new(
        Algorithm::SHA1,
        DEFAULT_DIGITS,
        DEFAULT_SKEW,
        DEFAULT_STEP_SECS,
        secret_bytes,
        Some(DEFAULT_ISSUER.to_string()),
        String::new(),
    )
    .map_err(|e| AppError::Crypto(format!("totp new: {e}")))?;

    totp.check_current(code)
        .map_err(|e| AppError::Crypto(format!("totp check: {e}")))
}

/// Regenerate the otpauth URL for an existing secret (used to re-show
/// the QR code during setup recovery). Does not generate a new secret.
pub fn url_for_secret(secret_base32: &str, account_name: &str) -> AppResult<String> {
    let secret = Secret::Encoded(secret_base32.to_string());
    let secret_bytes = secret
        .to_bytes()
        .map_err(|e| AppError::Crypto(format!("totp decode secret: {e}")))?;

    let totp = TOTP::new(
        Algorithm::SHA1,
        DEFAULT_DIGITS,
        DEFAULT_SKEW,
        DEFAULT_STEP_SECS,
        secret_bytes,
        Some(DEFAULT_ISSUER.to_string()),
        account_name.to_string(),
    )
    .map_err(|e| AppError::Crypto(format!("totp new: {e}")))?;

    Ok(totp.get_url())
}

// ---------------------------------------------------------------------------
// Tests. Verifies our totp-rs integration against RFC 6238 test vectors.
//
// RFC 6238 Appendix B uses:
//   - secret (ASCII): "12345678901234567890"
//   - SHA1, 8 digits, 30s step
// We build an explicit TOTP for that config (bypassing our 6-digit default)
// and assert the published vectors. If our library call is wrong, these
// tests catch it.
// ---------------------------------------------------------------------------
#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{Duration, UNIX_EPOCH};

    fn rfc_totp() -> TOTP {
        TOTP::new(
            Algorithm::SHA1,
            8, // RFC vectors use 8 digits
            0, // no skew for the vectors
            30,
            b"12345678901234567890".to_vec(),
            None,
            String::new(),
        )
        .unwrap()
    }

    fn rfc_case(secs: u64, expected: &str) {
        let t = UNIX_EPOCH + Duration::from_secs(secs);
        let code = rfc_totp().generate(t).unwrap();
        assert_eq!(code, expected, "at t={secs}");
    }

    #[test]
    fn rfc_6238_sha1_vectors() {
        rfc_case(59, "94287082");
        rfc_case(1111111109, "07081804");
        rfc_case(1111111111, "14050471");
        rfc_case(1234567890, "89005924");
        rfc_case(2000000000, "69279037");
        rfc_case(20000000000, "65353130");
    }

    #[test]
    fn setup_produces_url_and_secret() {
        let s = generate_setup("alice@example.com").unwrap();
        assert!(s.secret_base32.len() >= 16);
        assert!(s.otpauth_url.starts_with("otpauth://totp/"));
        assert!(s.otpauth_url.contains("secret="));
    }

    #[test]
    fn verify_roundtrip() {
        let s = generate_setup("alice@example.com").unwrap();
        // Build a TOTP for the same secret to produce the current code.
        let bytes = Secret::Encoded(s.secret_base32.clone())
            .to_bytes()
            .unwrap();
        let t = TOTP::new(
            Algorithm::SHA1,
            DEFAULT_DIGITS,
            DEFAULT_SKEW,
            DEFAULT_STEP_SECS,
            bytes,
            Some(DEFAULT_ISSUER.to_string()),
            String::new(),
        )
        .unwrap();
        let current = t.generate_current().unwrap();
        assert!(verify_code(&s.secret_base32, &current).unwrap());
    }

    #[test]
    fn verify_rejects_wrong_code() {
        let s = generate_setup("alice@example.com").unwrap();
        assert!(!verify_code(&s.secret_base32, "000000").unwrap());
    }

    #[test]
    fn url_for_existing_secret_matches_setup() {
        let s = generate_setup("alice@example.com").unwrap();
        let url = url_for_secret(&s.secret_base32, "alice@example.com").unwrap();
        assert!(url.starts_with("otpauth://totp/"));
        assert!(url.contains(&s.secret_base32));
    }
}