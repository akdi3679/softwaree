# TASK ID: SYNC-007.1
# TITLE: Add sync: protocol version negotiation
# STATUS: pending
# DEPENDENCIES: ADMIN-025.2
# ALLOWED FILES: product/apps/user/src-tauri/src/sync/protocol_version.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Refuse to sync if Admin and User don't agree on protocol version.

## REQUIRED IMPLEMENTATION

Create `product/apps/user/src-tauri/src/sync/protocol_version.rs`:

```rust
use product_contracts::sync::SyncHello;

pub const SUPPORTED: &[u32] = &[1];
pub const CURRENT: u32 = 1;

pub fn negotiate(hello: &SyncHello) -> Result<u32, String> {
    if !SUPPORTED.contains(&hello.protocol_version) {
        return Err(format!("protocol version {} not supported; current is {}", hello.protocol_version, CURRENT));
    }
    Ok(hello.protocol_version)
}
```

## TESTS

```bash
cd product
test -f apps/user/src-tauri/src/sync/protocol_version.rs || { echo "FAIL"; exit 1; }
grep -q "negotiate" apps/user/src-tauri/src/sync/protocol_version.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
