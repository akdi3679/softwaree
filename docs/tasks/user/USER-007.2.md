# TASK ID: USER-007.2
# TITLE: Add User two-factor (TOTP)
# STATUS: pending
# DEPENDENCIES: USER-007.1
# ALLOWED FILES: product/apps/user/src-tauri/src/auth/totp.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Optional TOTP second factor for User login (in addition to our mesh device key).

## REQUIRED IMPLEMENTATION

Add to Cargo.toml:
```toml
totp-rs = "5"
```

Create `product/apps/user/src-tauri/src/auth/totp.rs`:

```rust
use totp_rs::{Algorithm, Secret, TOTP};
use base64::Engine;
use base64::engine::general_purpose::STANDARD as B64;
use serde::{Deserialize, Serialize};
use crate::error::{AppError, AppResult};

const ISSUER = "Product";

#[derive(Debug, Serialize, Deserialize)]
pub struct TotpSetup {
    pub secret_b32: String,
    pub otpauth_url: String,
}

/// Generate a TOTP secret for the user. Returns a setup payload.
pub fn generate() -> AppResult<TotpSetup> {
    let secret = Secret::generate_secret();
    let secret_b32 = secret.to_encoded().to_string();
    let totp = TOTP::new(
        Algorithm::SHA1,
        6, 1, 30,
        secret.to_bytes().map_err(|e| AppError::Crypto(e.to_string()))?,
        Some(ISSUER.to_string()),
        "user".to_string(),
    ).map_err(|e| AppError::Crypto(e.to_string()))?;
    let otpauth_url = totp.get_url();
    Ok(TotpSetup { secret_b32, otpauth_url })
}

/// Verify a TOTP code. Returns true if the code is valid (within ±1 step).
pub fn verify(secret_b32: &str, code: &str) -> AppResult<bool> {
    let secret_bytes = Secret::Encoded(secret_b32.to_string()).to_bytes()
        .map_err(|e| AppError::Crypto(e.to_string()))?;
    let totp = TOTP::new(
        Algorithm::SHA1, 6, 1, 30,
        secret_bytes,
        Some(ISSUER.to_string()),
        "user".to_string(),
    ).map_err(|e| AppError::Crypto(e.to_string()))?;
    Ok(totp.check_current(code).unwrap_or(false))
}
```

## TESTS

```bash
cd product
test -f apps/user/src-tauri/src/auth/totp.rs || { echo "FAIL"; exit 1; }
grep -q "TOTP" apps/user/src-tauri/src/auth/totp.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
