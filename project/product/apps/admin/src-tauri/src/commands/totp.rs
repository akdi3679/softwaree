use serde::Serialize;

use crate::auth::totp as totp_lib;
use crate::error::AppResult;

#[derive(Debug, Serialize)]
pub struct TotpSetupResponse {
    pub secret_base32: String,
    pub otpauth_url: String,
}

/// Generate a fresh TOTP secret + otpauth URI for the current account.
///
/// The secret is NOT persisted by this command. The UI is responsible for:
///   1. Showing the QR code (using `otpauth_url`).
///   2. Asking the user for a code from their authenticator.
///   3. Calling `verify_totp_code` to confirm it before persisting.
#[tauri::command]
pub async fn generate_totp_setup(account_name: String) -> AppResult<TotpSetupResponse> {
    let setup = totp_lib::generate_setup(&account_name)?;
    Ok(TotpSetupResponse {
        secret_base32: setup.secret_base32,
        otpauth_url: setup.otpauth_url,
    })
}

/// Verify a 6-digit code against a base32 secret at the current time.
/// Returns `true` if the code is valid within the accepted time skew.
#[tauri::command]
pub async fn verify_totp_code(secret_base32: String, code: String) -> AppResult<bool> {
    totp_lib::verify_code(&secret_base32, &code)
}

/// Rebuild the otpauth URL for an existing secret (e.g. to redisplay the
/// QR code after the setup wizard was interrupted).
#[tauri::command]
pub async fn totp_url_for_secret(secret_base32: String, account_name: String) -> AppResult<String> {
    totp_lib::url_for_secret(&secret_base32, &account_name)
}