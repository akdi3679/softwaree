# ADR-006: Wasmtime for the Module Runtime

**Status:** Accepted — amended 2026-11-20
**Date:** 2026-07-26
**Amended:** 2026-11-20 — no raw DB handle, structured filters instead of raw SQL, JSON-only manifest, bundle directory path, corrected production and licence claims, qualified determinism, UI pointer to ADR-011
**Deciders:** Architecture team
**See also:** ADR-007 (signatures + encryption), ADR-011 (bundle + UI contract), ADR-012 (permissions), ADR-015 (updates)

---

## Context

Business modules (medical-reception, food-lab, future verticals) execute inside the Admin and User apps. They must be sandboxed, distributable as signed artifacts, verifiable, capable of the operations we need, and fast enough for a doctor waiting on a patient lookup.

## Decision

**Wasmtime** (Apache-2.0, Bytecode Alliance) as the module runtime, with **WASI Preview 2** as the system interface. Modules compile to `wasm32-wasip2` from Rust (or any WASI-compatible language).

The host embeds Wasmtime via the `wasmtime` Rust crate. Modules load with explicit capability grants derived from the manifest. A bundle also carries its **UI** (signed static JS/CSS in a sandboxed iframe) and an encrypted-content slot — see ADR-011.

---

## Consequences

### Positive
- **Real sandbox.** Memory isolation, no syscalls outside WASI, no ambient filesystem or network access. A module cannot read another module's data unless granted.
- **Capability-based security.** WASI Preview 2 grants are explicit. No ambient authority.
- **Standards compliance.** Wasmtime is the WASI reference implementation, backed by Mozilla, Fastly, Intel and Microsoft, with a published release/LTS cadence.
- **Production-proven.** Fastly Compute and Shopify Functions run Wasmtime in production; Envoy proxy filters run WASM. *(Cloudflare Workers uses V8 isolates, not Wasmtime — often miscited.)*
- **Fast cold start.** ~5 ms for typical modules.
- **Small footprint.** ~15 MB base runtime.
- **Rust-first host integration.** No FFI quirks.
- **Deterministic pure computation.** WASM execution is deterministic for a given input; host calls (DB, clock, network) are not. Replay tests record and replay host responses. We do **not** claim end-to-end determinism.

### Negative
- **WASM is slower than native** for compute-heavy work. Fine for business logic and host-mediated queries; wrong for a video codec.
- **WASI Preview 2 tooling is still maturing.** Mitigated by writing modules in Rust.
- **Module debugging is harder.** Mitigated by captured WASI stdout/stderr and a structured error API.

### Neutral
- No WASM GC needed; Rust ownership suffices.
- No WASM threads needed; single-threaded per module, multiple instances in parallel.

---

## Why Wasmtime over Wasmer

| | Wasmtime | Wasmer |
|---|---|---|
| Backing | Bytecode Alliance (non-profit) | Wasmer Inc. (commercial) |
| Standards | Reference implementation, WASI P2 + Component Model | Mostly there |
| Cold start | ~5 ms | ~8 ms (faster with LLVM backend) |
| Security | Capability-based, audited | Capability-based, less battle-tested |
| Package manager | None (we run our own registry) | WAPM |
| Production proof | Fastly Compute at scale | Smaller scale |
| Licence | Apache-2.0 | MIT |

We pick Wasmtime because:
1. **Security maturity matters more than peak speed** for regulated data.
2. **The Bytecode Alliance's track record** is stronger for the long haul.
3. **We do not need WAPM** — the Cloud runs our module registry.
4. **Apache-2.0's explicit patent grant** (which MIT lacks) reduces legal risk for enterprise customers. Both are permissive; the patent clause is the real difference.

---

## Module loading flow

```
1. Cloud publishes a module version: { id, version, manifest, signed_package_url }
2. Admin downloads the bundle
3. Admin runs the FULL ADR-007 verification:
     manifest bundle_hash → cloud_root → cert chain → project_license →
     device_bind (+ expiry) → ciphertext hash → decrypt → plaintext hash →
     UI asset hashes → api_version compatibility
4. Admin confirms the project's licence entitlement (ADR-014)
5. Admin stores the bundle at:
     projects/{id}/modules/{module}-{version}/
       manifest.json, manifest.sig.*, cert_chain.pem, binary.wasm.enc, ui/
6. Admin registers it in module_registry with verification timestamps
7. On invocation:
     a. Host re-verifies signatures, expiry, licence, module access, hashes
     b. Host creates a Wasmtime Store with the manifest's capability grants
     c. Host instantiates the module
     d. Host passes a context object: typed command/query handles and a
        capability-granted network handle — NEVER a raw DB handle
     e. Module runs and returns a result
     f. Host tears down the Store
8. If the module has UI, the host mounts the sandboxed iframe (ADR-011)
```

Modules are short-lived per invocation by default. A module backing an open screen may stay alive while the user interacts with it, then is torn down.

---

## Module API

The host exposes a small, versioned API. Modules get **no direct database access**; they call host functions that enforce authorization.

```rust
// In the module — a command
host.commands.create_patient(CreatePatientRequest {
    name: "...",
    phone: "...",
})?
// Host handles authorization, transaction, event, audit.
// Returns CreatePatientResult with the new patient ID.
```

```rust
// In the module — a query with a STRUCTURED filter
host.queries.list_patients(ListPatientsRequest {
    filter: Some(PatientFilter::NameStartsWith("A".into())),
    limit: 50,
})?
// Host filters by current permissions.
// Returns Vec<PatientProjection>.
```

**Filters are structured, typed enums — never raw SQL strings.** A raw SQL filter arriving from a module would be an authorization bypass: the module could name another module's tables or project a column it may not read. The host translates declared filters into parameterised SQL against the module's own `mod_<name>_*` tables.

The host API is stable per `api_version`. The host advertises its supported range; the manifest declares what the module was built against. A major mismatch means the module does not load, with a clear "needs a newer app" message (ADR-011).

---

## Alternatives Considered

**Wasmer.** Faster at peak, more SDKs; commercial backing, WAPM lock-in, Component Model behind. Rejected — see table.

**V8 isolates.** ~1 ms cold start, familiar to JS developers; larger memory, harder to call from Rust, no WASI capability equivalent, forces JS. Rejected: our modules are Rust/WASI.

**Native sidecar binaries.** Full performance; no sandbox, one buggy module compromises the host, OS-specific signing. Rejected: the security model collapses.

**In-process shared library (DLL/.so).** Easy; no isolation, platform-specific, signing much harder. Rejected for the same reason.

**Raw SQL filters for flexibility.** Rejected: it is an authorization bypass, and the flexibility is not needed by either v1 module.

---

## Enforcement

- The module manifest is **JSON**, canonicalised with JCS (RFC 8785). **No YAML** — canonical hashing requires one deterministic encoding (ADR-007).
- CI rejects a module without valid signatures and a complete manifest.
- Wasmtime is configured with all ambient capabilities disabled; only manifest grants are wired.
- Lint: a module may not import a host function absent from its manifest. Unknown imports fail the build.
- Lint: no host function accepts a SQL string, a table name, or a column list from a module.
- Lint: no host function hands out a database connection, file handle, or key.
- CPU budget 5 s per invocation, memory 64 MB per instance, max 4 concurrent instances (Principle 13). Exceeding a limit kills the instance and logs a security event.
- Every load re-verifies. A bundle valid at install time may have expired or been revoked since.

### Tests
- [ ] Module importing an undeclared host function → build failure
- [ ] Module attempting filesystem access without a grant → denied
- [ ] Module attempting network access without a grant → denied
- [ ] Raw SQL string in a filter payload → schema rejection
- [ ] Module querying another module's tables → denied
- [ ] Module reading `audit_entries` or `resource_keys` → denied
- [ ] Infinite loop → killed at 5 s, logged
- [ ] Memory bomb → killed at 64 MB, logged
- [ ] Expired `license_expiry` → refuses to load
- [ ] Unsupported `api_version` → clean message, no crash
- [ ] YAML manifest → rejected