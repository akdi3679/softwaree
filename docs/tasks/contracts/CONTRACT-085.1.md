# TASK ID: CONTRACT-085.1
# TITLE: Add contract: signing helper for end-to-end test fixtures
# STATUS: pending
# DEPENDENCIES: ARCH-012.2
# ALLOWED FILES: product/contracts/src/test_helpers/sign.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Easy helpers for tests: generate a key, sign envelopes, verify.

## REQUIRED IMPLEMENTATION

Create `product/contracts/src/test_helpers/sign.rs`:

```rust
//! Test helpers for signing envelopes.
#![cfg(any(test, feature = "test-helpers"))]

use ed25519_dalek::{SigningKey, VerifyingKey};
use rand::RngCore;
use crate::envelopes::CommandEnvelope;

pub fn test_signing_key() -> SigningKey {
    let mut bytes = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut bytes);
    SigningKey::from_bytes(&bytes)
}

pub fn signed_command(cmd: CommandEnvelope<serde_json::Value>, sk: &SigningKey) -> CommandEnvelope<serde_json::Value> {
    let bytes = serde_json::to_vec(&cmd).unwrap();
    let sig = sk.sign(&bytes);
    CommandEnvelope {
        signature: Some(hex::encode(sig.to_bytes())),
        public_key: Some(hex::encode(sk.verifying_key().as_bytes())),
        ..cmd
    }
}

pub fn assert_verified(cmd: &CommandEnvelope<serde_json::Value>, pk: &VerifyingKey) {
    let bytes = serde_json::to_vec(&serde_json::json!({
        "id": cmd.id, "command_type": cmd.command_type,
        "actor_id": cmd.actor_id, "device_id": cmd.device_id,
        "project_id": cmd.project_id, "payload": cmd.payload,
    })).unwrap();
    let sig_bytes = hex::decode(cmd.signature.as_ref().unwrap()).unwrap();
    let sig = ed25519_dalek::Signature::from_bytes(&sig_bytes.try_into().unwrap());
    pk.verify_strict(&bytes, &sig).expect("signature must verify");
}
```

## TESTS

```bash
cd product
test -f contracts/src/test_helpers/sign.rs || { echo "FAIL"; exit 1; }
grep -q "test_signing_key" contracts/src/test_helpers/sign.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
