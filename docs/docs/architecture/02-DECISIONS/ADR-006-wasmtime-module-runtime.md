# ADR-006: Wasmtime for the Module Runtime

**Status:** Accepted
**Date:** 2026-07-26
**Deciders:** Architecture team

---

## Context

Business modules (medical-reception, food-lab, future verticals) must execute inside the Admin and User apps. They need to be:
- Sandboxed (cannot read other modules' data, cannot escape)
- Distributable (signed artifacts the Admin downloads)
- Verifiable (signature + integrity)
- Capable of the operations we need (DB access, network, UI, computation)
- Fast enough for a doctor waiting for a patient lookup

We need to pick a runtime.

## Decision

**Wasmtime** (Apache-2.0, Bytecode Alliance) as the module runtime, with **WASI Preview 2** as the system interface. Modules are compiled to `wasm32-wasip2` from Rust (or any WASI-compatible language).

The host (Admin / User app) embeds Wasmtime via the `wasmtime` Rust crate. Modules are loaded with explicit capability grants derived from the module's manifest.

## Consequences

### Positive

- **Real sandbox.** Wasmtime enforces memory isolation, no syscalls outside WASI, no ambient access to the host filesystem or network. A module cannot read the Admin's other data unless explicitly granted.
- **Capability-based security.** WASI Preview 2's "capability-based" model means the module can only do what we grant it. No ambient authority.
- **Standards compliance.** Wasmtime is the WASI reference implementation. Backed by Mozilla, Fastly, Intel, Microsoft. Long-term support guaranteed.
- **Production-proven at scale.** Fastly Compute, Shopify Functions, Cloudflare Workers (originally), Envoy proxy filters — all use WASM runtimes in production.
- **Fast cold start.** ~5ms for typical modules. Fast enough for an interactive desktop app.
- **Small memory footprint.** ~15MB base runtime. Acceptable for a desktop app.
- **Rust host integration.** Wasmtime is Rust-first, we can call into it from the Admin's Rust backend with zero FFI quirks.
- **Deterministic execution.** Same input → same output. Great for testing and replay.

### Negative

- **WASM is not as fast as native code** in compute-heavy workloads. For our use cases (UI rendering, business logic, DB queries through the host), this is fine. For something like a video codec, it would not be.
- **WASI Preview 2 is newer.** Some language tooling is still catching up. We mitigate by writing modules in Rust, which has solid WASI Preview 2 support.
- **Module debugging is harder** than native debugging. We provide good logging via WASI stdout/stderr capture, plus a structured error API.

### Neutral

- We don't need WASM GC (garbage-collected reference types) for our modules. Rust's ownership model is enough.
- We don't need WASM threads for our modules. Single-threaded per module is fine; multiple modules can run in parallel processes if needed.

## Why Wasmtime over Wasmer

| | Wasmtime | Wasmer |
|---|---|---|
| Backing | Bytecode Alliance (Mozilla, Fastly, Intel, Microsoft), non-profit | Wasmer Inc., commercial |
| Standards | Reference implementation, full WASI Preview 2 + Component Model | Mostly there, Component Model in progress |
| Performance | ~5ms cold start, 15MB base | ~8ms cold start, 25MB base (faster with LLVM backend) |
| Security | Capability-based, audited | Capability-based, less battle-tested |
| Package manager | None (we have our own) | WAPM (their own) |
| Production proof | Fastly Compute at scale | Smaller scale |
| License | Apache-2.0 | MIT |

We pick Wasmtime because:
1. **Security maturity matters more than raw speed** for our use case. A leaked module is exactly the kind of thing we cannot afford.
2. **Bytecode Alliance's track record** is stronger than Wasmer Inc.'s for the long haul.
3. **We don't need WAPM** — we have our own module registry in the Cloud.
4. **Apache-2.0 license** is more enterprise-friendly than MIT for our customer-facing code paths (we have the option to fork if needed without worrying about relicensing).

## Module Loading Flow

```
1. Cloud publishes module: { id, version, manifest, signed_package_url }
2. Admin downloads signed_package
3. Admin verifies triple signature (see ADR-007)
4. Admin checks plan allows this module for this project
5. Admin stores module binary in projects/{id}/modules/{name}-{version}.wasm
6. Admin registers module in module_registry table
7. When module is invoked:
   a. Host creates a Wasmtime Store with capability grants
   b. Host instantiates the module
   c. Host passes a context object (with DB handle, network handle, etc.)
   d. Module runs, returns a result
   e. Host tears down the Store
```

Modules are short-lived per invocation by default. Long-running modules (e.g., a UI component) can be kept alive as long as the user is interacting with them, then torn down.

## Module API

The host exposes a small, versioned API to modules. Modules don't get direct DB access; they call the host API which enforces authorization:

```rust
// In the module
host.commands.create_patient(CreatePatientRequest {
    name: "...",
    phone: "...",
})?
// Host handles authorization, transaction, event, audit
// Returns PatientCreatedResult with the new patient ID
```

```rust
// In the module
host.queries.list_patients(ListPatientsRequest {
    filter: Some("name LIKE 'A%'"),
    limit: 50,
})?
// Host filters by current permissions
// Returns Vec<PatientProjection>
```

The host API is stable per module API version. The module can be recompiled against newer host APIs, and the host advertises which API versions it supports in the manifest.

## Alternatives Considered

### Wasmer

**Pros:** faster at peak with LLVM backend, more language SDKs.
**Cons:** commercial backing with smaller enterprise footprint; WAPM lock-in; Component Model not fully there.
**Rejected because:** see comparison above.

### V8 isolates (like Cloudflare Workers)

**Pros:** fastest cold start (~1ms), familiar to JS developers.
**Cons:** larger memory footprint; harder to call from Rust; no equivalent of WASI capability grants; not as portable.
**Rejected because:** our modules are not JS; they're Rust (or potentially any WASI language). V8 isolates would force JS.

### Native sidecar binaries

**Pros:** full performance, full power.
**Cons:** no sandbox; one buggy module = host compromise; signing and binding is harder; OS-specific.
**Rejected because:** the security model collapses. Defeats the purpose of a module system.

### In-process shared library (DLL / .so)

**Pros:** easy.
**Cons:** no sandbox, no isolation, native binary is platform-specific, signing is much harder.
**Rejected because:** same security concerns as sidecar binaries.

## Enforcement

- The module manifest is a signed YAML/JSON. CI rejects modules without a valid signature.
- Wasmtime is configured with `wasmtime::Config::new()` that disables all ambient capabilities. The module can only access what we explicitly grant.
- A linter rule: modules cannot import host functions that aren't declared in the manifest. Unknown imports = compile error.
- Module execution has a CPU time budget (configurable, default 5s per call). Exceeding it kills the module and logs the violation.
