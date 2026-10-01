# TASK ID: CHAOS-007.1
# TITLE: Add chaos: malicious device attempts to inject events
# STATUS: pending
# DEPENDENCIES: USER-017.2
# ALLOWED FILES: product/apps/user/src-tauri/tests/chaos_malicious_device.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
A device without a valid key tries to push events. Reject.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src-tauri/tests/chaos_malicious_device.rs`:

```rust
use product_user_lib::sync::verify_frame::verify_admin_signature;
use ed25519_dalek::{SigningKey, VerifyingKey, SECRET_KEY_LENGTH, Signature};
use rand::Rng;

#[tokio::test]
async fn rejects_event_from_unauthorized_device() {
    // The real admin's key
    let mut real_bytes = [0u8; SECRET_KEY_LENGTH];
    rand::thread_rng().fill(&mut real_bytes);
    let real_sk = SigningKey::from_bytes(&real_bytes);
    let real_pk = real_sk.verifying_key();
    // The attacker's key
    let mut att_bytes = [0u8; SECRET_KEY_LENGTH];
    rand::thread_rng().fill(&mut att_bytes);
    let att_sk = SigningKey::from_bytes(&att_bytes);

    let event = b"{\"event_type\":\"patient.created\",\"payload\":{...}}";
    let real_sig = real_sk.sign(event);
    let att_sig = att_sk.sign(event);

    // The User knows the real public key
    let mut real_pk_bytes = [0u8; 32];
    real_pk_bytes.copy_from_slice(real_pk.as_bytes());

    // Real signature should verify
    assert!(verify_admin_signature(&real_pk_bytes, event, &real_sig.to_bytes().into()).is_ok());
    // Attacker signature should NOT verify
    assert!(verify_admin_signature(&real_pk_bytes, event, &att_sig.to_bytes().into()).is_err());
}
```

## TESTS

```bash
cd product
test -f apps/user/src-tauri/tests/chaos_malicious_device.rs || { echo "FAIL"; exit 1; }
grep -q "rejects_event_from_unauthorized" apps/user/src-tauri/tests/chaos_malicious_device.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
