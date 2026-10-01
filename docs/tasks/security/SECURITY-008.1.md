# TASK ID: SECURITY-008.1
# TITLE: Add security: signature verification of every sync frame
# STATUS: pending
# DEPENDENCIES: SYNC-007.2
# ALLOWED FILES: product/apps/user/src-tauri/src/sync/verify_frame.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Reject any frame that doesn't have a valid signature from the Admin's device key.

## REQUIRED IMPLEMENTATION

Add to `Cargo.toml`:
```toml
ed25519-dalek = "2"
```

Create `product/apps/user/src-tauri/src/sync/verify_frame.rs`:

```rust
use ed25519_dalek::{Signature, Verifier, VerifyingKey};
use crate::error::{AppError, AppResult};

pub fn verify_admin_signature(
    admin_public_key: &[u8; 32],
    message: &[u8],
    signature: &[u8; 64],
) -> AppResult<()> {
    let pk = VerifyingKey::from_bytes(admin_public_key)
        .map_err(|e| AppError::Crypto(e.to_string()))?;
    let sig = Signature::from_bytes(signature);
    pk.verify(message, &sig).map_err(|e| AppError::Auth(format!("signature invalid: {e}")))?;
    Ok(())
}
```

## TESTS

```bash
cd product
test -f apps/user/src-tauri/src/sync/verify_frame.rs || { echo "FAIL"; exit 1; }
grep -q "verify_admin_signature" apps/user/src-tauri/src/sync/verify_frame.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
