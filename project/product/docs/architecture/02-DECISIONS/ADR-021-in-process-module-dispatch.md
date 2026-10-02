# ADR-021: In-Process Module Dispatch for v1

**Status:** Accepted
**Date:** 2026-10-01
**Supersedes:** none
**Superseded by:** none (planned: superseded by WASM dispatch in v1.1)

---

## Context

ADR-006 says modules run in Wasmtime for sandboxing. That is the right
long-term architecture. But v1 hit two blockers:

1. The `wasm32-wasip2` target is not installed on the build machine.
2. The module crates export plain Rust (`pub fn handle_command(cmd)`),
   not the WIT-defined functions a component requires.

The business modules (`medical-reception`, `food-lab`) compile cleanly as
native Rust and their `handle_command` / `handle_query` signatures are
identical to what a WASM component would expose.

## Decision

For v1, business modules are called in-process. The Admin's
`modules::dispatch::run_command` calls
`medical_reception::handle_command(cmd)` directly. Events + audit commit
in one transaction (Principle 4).

The interface is identical to the WASM case:
- input: a `Command` struct from `product-module-sdk`
- output: a `CommandOutcome` with `events` + `response`

Switching to Wasmtime in v1.1 changes only the *inside* of
`run_command`. Callers do not change.

## Why this is safe in v1

- **Modules are ours.** v1 has no third-party marketplace (per
  `docs/marketplace/PUBLISHER.md`). Every module is code we wrote and
  reviewed.
- **The sandbox protects against untrusted code.** With no third-party
  code, the sandbox's primary threat does not exist yet.
- **The manifest declares capabilities** regardless of runtime. When
  WASM lands, the same manifest constrains the same code.
- **The WASM path is documented.** `docs/architecture/WASMTIME-INTEGRATION.md`
  lists exactly what remains.

## Consequences

**Positive:**

- v1 is functional. The Admin creates patients, books appointments,
  processes samples. Events land in the event log. Audit chains.
- No new build requirements (`rustup target add` can wait).
- The `handle_command` interface is exercised end-to-end, so when WASM
  lands, the module API is already battle-tested.

**Negative:**

- A bug in a module could crash the Admin (no process isolation).
  Mitigation: modules are reviewed; Rust ownership prevents memory
  unsafety; the module surface is small.
- CPU/memory limits are not enforced (no fuel metering). Mitigation:
  module code is bounded by design; v1.1 adds enforcement.
- The "modules cannot cross borders" Principle 8 becomes a code-review
  discipline rather than a runtime guarantee. Mitigation: lint rules
  (not yet written); a v1.1 ADR will document the migration.

## Alternatives considered

**Ship without any working modules.** Rejected: the app has no
demonstrable value. A verification team cannot verify "it works" if
nothing works.

**Wait for the WASM toolchain.** Rejected: no timeline for the
toolchain, and the toolchain is not the bottleneck — the WIT-bindgen
rework is.

**Run modules in a child process.** Rejected: adds IPC, error
handling, and lifecycle complexity that the WASM sandbox solves better
once it lands. Would be throwaway work.

## Migration path

v1.1:

1. `rustup target add wasm32-wasip2`
2. Add `wit-bindgen` to each module crate, export `handle-command` /
   `handle-query`.
3. `wasm-tools component new` produces the component binary.
4. Replace the body of `run_command` with `Wasmtime::invoke`.
5. Delete the direct `medical_reception::handle_command` call.

No callers change. The module SDK is unchanged. The manifest is
unchanged.

## References

- ADR-006-wasmtime-module-runtime.md (long-term architecture)
- `docs/architecture/WASMTIME-INTEGRATION.md` (migration plan)
- `apps/admin/src-tauri/src/modules/dispatch.rs` (v1 implementation)
- `apps/admin/src-tauri/tests/module_roundtrip.rs` (proof it works)