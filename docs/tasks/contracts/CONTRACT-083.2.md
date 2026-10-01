# TASK ID: CONTRACT-083.2
# TITLE: Add shared Rust test helpers
# STATUS: pending
# DEPENDENCIES: CONTRACT-083.1
# ALLOWED FILES: product/packages/contracts-rs/src/test_helpers.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Mirror of the TS test helpers, in Rust.

## REQUIRED IMPLEMENTATION

Create `product/packages/contracts-rs/src/test_helpers.rs`:

```rust
//! Test helpers for shared Rust contracts.

use crate::ids::*;

/// Generate a random base32 string (Crockford-style alphabet, lowercase).
pub fn random_string(len: usize) -> String {
    const ALPHABET: &[u8; 32] = b"0123456789abcdefghjkmnpqrstvwxyz";
    let mut out = String::with_capacity(len);
    for _ in 0..len {
        let idx = (rand::random::<u32>() as usize) % 32;
        out.push(ALPHABET[idx] as char);
    }
    out
}

pub fn make_project_id() -> ProjectId { ProjectId::new(format!("proj_{}", random_string(22))) }
pub fn make_user_id() -> UserId { UserId::new(format!("usr_{}", random_string(22))) }
pub fn make_device_id() -> DeviceId { DeviceId::new(format!("dev_{}", random_string(22))) }
pub fn make_session_id() -> SessionId { SessionId::new(format!("sess_{}", random_string(22))) }
pub fn make_command_id() -> CommandId { CommandId::new(format!("cmd_{}", random_string(22))) }
pub fn make_event_id() -> EventId { EventId::new(format!("evt_{}", random_string(22))) }
```

## TESTS

```bash
cd product
test -f packages/contracts-rs/src/test_helpers.rs || { echo "FAIL"; exit 1; }
grep -q "make_project_id" packages/contracts-rs/src/test_helpers.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
