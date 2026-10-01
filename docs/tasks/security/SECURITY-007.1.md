# TASK ID: SECURITY-007.1
# TITLE: Add security: secure memory for keys (zero-on-drop)
# STATUS: pending
# DEPENDENCIES: I18N-003.2
# ALLOWED FILES: product/apps/admin/src-tauri/src/auth/secure_mem.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Wrap secrets in a guard that zeros memory on Drop.

## REQUIRED IMPLEMENTATION

Add to `Cargo.toml`:
```toml
zeroize = "1"
```

Create `product/apps/admin/src-tauri/src/auth/secure_mem.rs`:

```rust
use zeroize::{Zeroize, ZeroizeOnDrop};

#[derive(Zeroize, ZeroizeOnDrop)]
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
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/auth/secure_mem.rs || { echo "FAIL"; exit 1; }
grep -q "SecretKey" apps/admin/src-tauri/src/auth/secure_mem.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
