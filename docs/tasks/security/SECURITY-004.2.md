# TASK ID: SECURITY-004.2
# TITLE: Add fuzz tests for sync frame decoder
# STATUS: pending
# DEPENDENCIES: SECURITY-004.1
# ALLOWED FILES: product/apps/admin/src-tauri/src/sync/fuzz_frames.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
cargo-fuzz target: feed random bytes to the frame decoder. Must not panic.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src-tauri/src/sync/fuzz_frames.rs`:

```rust
#![no_main]
use libfuzzer_sys::fuzz_target;
use product_admin_lib::sync::frames;

fuzz_target!(|data: &[u8]| {
    // We don't care if it returns Err — we just want to ensure no panic.
    let _ = frames::decode(data);
});
```

Add to `Cargo.toml`:
```toml
[dev-dependencies]
libfuzzer-sys = "0.4"
```

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/src/sync/fuzz_frames.rs || { echo "FAIL"; exit 1; }
grep -q "fuzz_target" apps/admin/src-tauri/src/sync/fuzz_frames.rs || { echo "FAIL"; exit 1; }
echo "OK"
```
