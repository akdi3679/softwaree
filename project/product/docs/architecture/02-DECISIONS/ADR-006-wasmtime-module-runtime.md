# ADR-006: Wasmtime As Module Runtime

**Status:** Accepted
**Date:** 2026-02-01
**Supersedes:** none
**Superseded by:** none

---

## Context

Business modules (medical-reception, food-lab, future verticals) must run
inside the Admin and User apps with strong isolation. They must not be
able to read each other's data, escape their sandbox, or access the host
filesystem or network.

Options:

1. Dynamic libraries (.so / .dll). Native speed. No sandbox.
2. Lua / JavaScript scripting. Sandboxable. Slow and hard to audit.
3. WASM with Wasmtime.

## Decision

Modules are compiled to `wasm32-wasip2` and executed inside Wasmtime.

Capabilities are declared in the module manifest and granted at
instantiation time. The runtime enforces:

- CPU budget: 5 seconds per invocation.
- Memory budget: 64 MB per instance.
- Filesystem, network, clock: denied by default; granted explicitly.
- Max concurrent instances: 4.

## Consequences

Positive:

- Strong sandbox: capabilities are opt-in per module.
- Language-agnostic in principle (Rust is our choice, but any WASM
  compiler target works).
- Fast cold start (about 5ms).
- Enterprise-backed runtime with a long track record.

Negative:

- WASM does not have full system access; any host service must be exposed
  as a host function.
- Some Rust crates do not compile to `wasm32-wasip2`. Mitigation: keep
  module dependencies minimal; use `#[cfg(target_arch = "wasm32")]` for
  the module build.

## Alternatives considered

**Native dynamic libraries.** Rejected: no sandbox, no portability, a
single bad module could compromise the whole app.

**Lua.** Rejected: dynamic typing would make audit harder, and CPU/memory
limits are weaker.

**Node.js worker_threads / vm2.** Rejected: JS sandboxes have a poor
security track record, and Node in a Tauri app is a mismatch.

## References

- docs/architecture/01-PRINCIPLES.md rules 8, 13
- modules/sdk/