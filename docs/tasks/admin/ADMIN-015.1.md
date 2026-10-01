# TASK ID: ADMIN-015.1
# TITLE: Add Admin two-factor (TOTP)
# STATUS: pending
# DEPENDENCIES: USER-009.3
# ALLOWED FILES: product/apps/admin/src-tauri/src/auth/totp.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Optional TOTP second factor for the Admin's cloud account.

## REQUIRED IMPLEMENTATION

Add to `Cargo.toml`:
```toml
totp-rs = "5"
```

Create `product/apps/admin/src-tauri/src/auth/totp.rs`:

```rust
use totp_rs::{Algorithm, Secret, TOTP};
use base64::Engine;
use base64::engine::general_purpose::STANDARD as B64;
use crate::error::{AppError, AppResult};

const ISSUER = "Product";

pub fn generate() -> AppResult<(String, String)> {
    let secret = Secret::generate_secret();
    let secret_b32 = secret.to_encoded().to_string();
    let totp = TOTP::new(
        Algorithm::SHA1, 6, 1, 30,
        secret.to_bytes().map_err(|e| AppError::Crypto(e.to_string()))?,
        Some(ISSUER.to_string()),
        "admin".to_string(),
    ).map_err(|e| AppError::Crypto(e.to_string()))?;
    Ok((secret_b32, totp.get_url()))
}

pub fn verify(secret_b32: &str, code: &str) -> AppResult<bool> {
    let bytes = Secret::Encoded(secret_b32.to_string()).to_bytes()
        .map_err(|e| AppError::Crypto(e.to_string()))?;
    let totp = TOTP::new(
        Algorithm::SHA1, 6, 1, 30,
        bytes,
        Some(ISSUER.to_string()),
        "admin".to_string(),
    ).map_err(|e| AppError::Crypto(e.to_string()))?;
    Ok(totp.check_current(code).unwrap_or(false))
}
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/auth/totp.rs || { echo "FAIL"; exit 1; }
grep -q "TOTP" apps/admin/src-tauri/src/auth/totp.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
