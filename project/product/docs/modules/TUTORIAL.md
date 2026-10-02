# Module tutorial: build a "Hello, World" module

This walks through building a module, its manifest, and how to test it locally.

## Step 1 — Create the crate

```bash
cd product/modules
cargo new --lib hello-module
```

## Step 2 — Point at the SDK

Edit `hello-module/Cargo.toml`:

```toml
[package]
name = "hello-module"
version.workspace = true
edition.workspace = true

[dependencies]
product-module-sdk = { path = "../sdk" }
serde = { workspace = true }
serde_json = { workspace = true }
```

## Step 3 — Implement the handler

```rust
// src/lib.rs
use product_module_sdk::command::{Command, CommandOutcome};
use product_module_sdk::query::{Query, QueryOutcome};
use product_module_sdk::ModuleResult;

pub fn handle_command(cmd: Command) -> ModuleResult<CommandOutcome> {
    Ok(CommandOutcome {
        events: vec![],
        response: serde_json::json!({ "hello": "world", "input": cmd.payload }),
    })
}

pub fn handle_query(_q: Query) -> ModuleResult<QueryOutcome> {
    Ok(QueryOutcome {
        response: serde_json::json!({ "version": env!("CARGO_PKG_VERSION") }),
    })
}
```

## Step 4 — Build

```bash
cargo check -p hello-module
```

Once Wasmtime wiring is done, this becomes:

```bash
rustup target add wasm32-wasip2
cargo build -p hello-module --target wasm32-wasip2 --release
```

Output: `target/wasm32-wasip2/release/hello_module.wasm`.

## Step 5 — Test

The fuzz crate at `modules/sdk-tests/fuzz/` shows one way to drive a
`Command` through the SDK. Your own module tests should live in
`src/concurrency_tests.rs` next to the module (see `medical-reception`
and `food-lab` for examples).

## Step 6 — Publish

Run `scripts/publish-module.sh hello-module 0.1.0 <cloud-url>`. This builds
the WASM, computes sha256, and POSTs the signed package to the Cloud.

See `docs/modules/COOKBOOK.md` for common patterns and the full list of
things a module cannot do.
