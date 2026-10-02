# Wasmtime Integration - Status and Roadmap

> **Status:** Incomplete. This document tells the next engineer exactly
> what is missing and how to finish it.
> **Owner:** whoever picks up Category C in `HANDOFF.md`.

---

## 1. What is done

`apps/admin/src-tauri/src/modules/runtime.rs` is complete:

- A Wasmtime `Engine` is built with:
  - `component_model(true)` - so the runtime can load components
    (wasm32-wasip2), not just core wasm.
  - `consume_fuel(true)` - hard CPU cap per invocation.
  - `epoch_interruption(true)` - the host can force a timeout.
- `ModuleRuntime::load_module(path)` loads a core `.wasm`.
- `ModuleRuntime::prepare_store(data)` returns a `Store` with the
  standard fuel limit applied.
- Unit tests cover both.

`apps/admin/src-tauri/src/modules/verify.rs` is complete:

- Ed25519 verification of the cloud_root + project_license signatures.
- HMAC-SHA256 verification of the device_bind MAC.
- 8 tests, all passing.

`apps/admin/src-tauri/src/modules/installer.rs` is complete:

- Decodes a module package, verifies sha256, verifies all three
  signatures, writes the binary to disk atomically, inserts a
  `module_registry` row.
- Uses `verify::verify_all`.

---

## 2. What is NOT done

### 2.1 No wasm32-wasip2 toolchain target installed

The `medical-reception`, `food-lab`, and other module crates currently
build only for the host (`x86_64-pc-windows-msvc`). To produce a
component that the runtime can load, the toolchain needs:

    rustup target add wasm32-wasip2

Then each module needs:

    cargo build -p medical-reception --target wasm32-wasip2 --release

Estimated: 5 minutes.

### 2.2 The WIT file is likely malformed

`modules/sdk/wit/product.wit` declares a `world handler` exporting
`handle-command` and `handle-query`. Recon shows the `command`, `event`,
and other records appear truncated. **Verify the file compiles** with:

    wasm-tools component wit modules/sdk/wit/product.wit

If it does not, fix the records. The intended shape is:

    record command {
        id: string,
        command-type: string,
        aggregate-type: string,
        aggregate-id: string,
        actor-user-id: string,
        device-id: string,
        correlation-id: option<string>,
        payload: string,
    }

    record event {
        id: string,
        event-type: string,
        aggregate-type: string,
        aggregate-id: string,
        version: s64,
        occurred-at: string,
        payload: string,
    }

    record query {
        id: string,
        query-type: string,
        payload: string,
    }

    record command-outcome {
        events: list<event>,
        response: string,
    }

    record query-outcome {
        response: string,
    }

Estimated: 30 minutes.

### 2.3 The module crate does not export WIT functions

`modules/medical-reception/src/lib.rs` currently exports plain Rust:

    pub fn handle_command(cmd: Command) -> ModuleResult<CommandOutcome>

The WIT world expects `handle-command: func(cmd: command) -> result<command-outcome, string>`. To bridge:

1. Add `wit-bindgen = "0.30"` (or the version that matches the wasmtime
   release) to `modules/medical-reception/Cargo.toml`.
2. In `lib.rs`, add:

       wit_bindgen::generate!({
           path: "../sdk/wit/product.wit",
           world: "handler",
       });

3. Implement a struct that converts WIT `command` <-> the existing
   `product_module_sdk::command::Command` and delegates.
4. `export!(MyHandler)` at the bottom.

Estimated: half a day.

### 2.4 The host side has no `bindgen!` and no host trait

The Admin runtime needs to:

1. Use `wasmtime::component::bindgen!` to generate Rust types for the
   same WIT world.
2. Implement the `host` interface (WIT `interface host`):
   - `log(level: string, message: string)` -> `tracing::info!/warn!/error!`
   - `now-iso8601() -> string` -> `chrono::Utc::now().to_rfc3339()`
   - `uuid-v7() -> string` -> `uuid::Uuid::now_v7().to_string()`
   - `read-projection(table, key) -> option<string>` -> SQL against the
     project's projection DB, gated by the manifest's capabilities
   - `write-audit(action, target-type, target-id, details) -> result<_, string>`
     -> `audit::writer::append` inside the current transaction
3. Load a `.wasm` component via `wasmtime::component::Component::from_file`.
4. Link the host imports and instantiate.
5. Call `handle_command(cmd)` / `handle_query(q)` on the instance.

This is the bulk of the work. It touches:

- `apps/admin/src-tauri/src/modules/runtime.rs` - add
  `load_component`, `instantiate_component`, `execute_command`,
  `execute_query`.
- A new `apps/admin/src-tauri/src/modules/host.rs` - implement the WIT
  `host` interface using `AppState` (projects map, audit writer).
- `apps/admin/src-tauri/src/commands/module_cmd.rs` - call the new
  `execute_command` instead of returning "pending".
- `apps/admin/src-tauri/src/commands/module_query.rs` - same.

Estimated: 3-5 days of focused work by a dev with Wasmtime experience.

---

## 3. Acceptance criteria

Category C1b is complete when:

1. `rustup target list --installed` includes `wasm32-wasip2`.
2. `cargo build -p medical-reception --target wasm32-wasip2 --release`
   produces a `.wasm` component.
3. The Admin's `module_command` IPC handler loads that `.wasm`, calls
   `patient.create`, and the resulting event lands in `events`.
4. The Admin's `module_query` IPC handler loads the same `.wasm`, calls
   `patient.list`, and the UI renders the returned patients.
5. An integration test (`apps/admin/src-tauri/tests/module_roundtrip.rs`)
   exercises the full path with the real module binary.

---

## 4. Why this wasn't done in the wiring session

The wiring session was source-only:

- No wasm toolchain target installed.
- No way to run a component.
- The WIT file's correctness was unverified.

Everything that *can* be written without a running environment has
been. What remains is genuine dev work that needs:

1. A machine with `rustup target add wasm32-wasip2`.
2. A machine with `wasm-tools` for WIT verification.
3. Iteration against a real compiled module.

That is a dev task, not a verification task. See `HANDOFF.md` section 5.

---

## 5. Files touched in this session

Complete:

- `apps/admin/src-tauri/src/modules/runtime.rs`
- `apps/admin/src-tauri/src/modules/verify.rs`
- `apps/admin/src-tauri/src/modules/installer.rs`

Needs work:

- `modules/sdk/wit/product.wit` (verify/fix)
- `modules/medical-reception/src/lib.rs` (export WIT)
- `modules/medical-reception/Cargo.toml` (add wit-bindgen)
- `apps/admin/src-tauri/src/modules/host.rs` (new)
- `apps/admin/src-tauri/src/commands/module_cmd.rs` (wire real call)
- `apps/admin/src-tauri/src/commands/module_query.rs` (wire real call)