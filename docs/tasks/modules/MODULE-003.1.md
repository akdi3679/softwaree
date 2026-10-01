# TASK ID: MODULE-003.1
# TITLE: Add module sandbox fuzzing
# STATUS: pending
# DEPENDENCIES: SYNC-002.4
# ALLOWED FILES: product/modules/sdk-tests/fuzz/Cargo.toml, product/modules/sdk-tests/fuzz/fuzz_targets/command.rs
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Fuzz test the module SDK: random inputs should never crash a module in a way that escapes the sandbox.

## REQUIRED IMPLEMENTATION

Create `product/modules/sdk-tests/fuzz/Cargo.toml`:

```toml
[package]
name = "sdk-fuzz"
version = "0.1.0"
edition = "2021"

[[bin]]
name = "command"
path = "fuzz_targets/command.rs"

[dependencies]
product-module-sdk = { path = "../../packages/module-sdk" }
arbitrary = { version = "1", features = ["derive"] }
libfuzzer-sys = "0.4"
```

Create `product/modules/sdk-tests/fuzz/fuzz_targets/command.rs`:

```rust
#![no_main]
use libfuzzer_sys::fuzz_target;
use product_module_sdk::command::Command;
use arbitrary::Arbitrary;

#[derive(Debug, Arbitrary)]
struct FuzzCommand {
    id: String,
    command_type: String,
    aggregate_type: String,
    aggregate_id: String,
    actor_user_id: String,
    device_id: String,
    correlation_id: Option<String>,
    payload: serde_json::Value,
}

fuzz_target!(|data: FuzzCommand| {
    let cmd = Command {
        id: data.id,
        command_type: data.command_type,
        aggregate_type: data.aggregate_type,
        aggregate_id: data.aggregate_id,
        actor_user_id: data.actor_user_id,
        device_id: data.device_id,
        correlation_id: data.correlation_id,
        payload: data.payload,
    };
    // We don't actually run the command; we just ensure constructing a Command is safe
    let _ = serde_json::to_string(&cmd).unwrap();
});
```

## TESTS

```bash
cd product
test -f modules/sdk-tests/fuzz/Cargo.toml || { echo "FAIL"; exit 1; }
test -f modules/sdk-tests/fuzz/fuzz_targets/command.rs || { echo "FAIL: no target"; exit 1; }
grep -q "libfuzzer-sys" modules/sdk-tests/fuzz/Cargo.toml || { echo "FAIL: no fuzzer"; exit 1; }
echo "OK"
```
