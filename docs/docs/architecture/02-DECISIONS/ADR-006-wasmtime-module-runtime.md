# ADR-006: Wasmtime for the Module Runtime

**Status:** Accepted — amended 2026-11-20 (review pass 2)
**Date:** 2026-07-26
**Amended:** module contract defined, migrations-in-bundle added, performance claims marked "to measure", raw SQL filters removed, platform events and seed data clarified.
**Deciders:** Architecture team
**See also:** ADR-007 (signatures + encryption), ADR-011 (bundle + UI), ADR-012 (permissions), ADR-015 (updates)

---

## Context

Business modules must execute inside the Admin and User apps. They must be sandboxed, distributable as signed artifacts, verifiable, capable of the operations we need, and fast enough for interactive use.

## Decision

**Wasmtime** (Apache-2.0, Bytecode Alliance) as the module runtime, with **WASI Preview 2** as the system interface. Modules compile to `wasm32-wasip2` from Rust.

The host embeds Wasmtime via the `wasmtime` Rust crate. Modules load with explicit capability grants derived from the manifest. A bundle also carries its **UI** (signed static JS/CSS in a sandboxed iframe) and an encrypted-content slot — see ADR-011.

---

## The module contract

This is the formal interface between a module and the host. It is what makes the `LabModule` trait portable to WASM.

### What the module exports

```text
handle_command(ctx, command) → Vec<Event>
apply_event(event) → Vec<RowOp>
```

- `handle_command` receives a validated command from the host and returns a list of **events** (state deltas). It does NOT write to any table. It is a pure function: command in, events out.
- `apply_event` receives an event and returns a list of **row operations** (inserts, updates, deletes) on the module's own tables. It is the module-side projection logic.

### What the host does

The host is the authority. For every command:

```text
1. Validate input against the command schema (from manifest)
2. Authorise the actor: canRead/canWrite against current permissions
3. BEGIN IMMEDIATE
4.   SELECT command_log by (actor_id, idempotency_key)
       found → compare request_hash → match: return stored result
                                    → mismatch: IdempotencyConflict
     check expected_version → ConflictError if stale
5.   Call module.handle_command(ctx, command) → events
6.   For each event:
          assign sequence = COALESCE(MAX(sequence),0)+1   -- gapless, ADR-004 (NOT AUTOINCREMENT)
     stamp module_version from the manifest          -- replay pinning (see "Determinism and replay pinning")
     append to events table
     call module.apply_event(event) → row ops
     validate every row op (see "RowOp validation"), then execute against mod_<id>_* tables
     append to audit_entries (hash-chained)
7.   INSERT outbox row
8.   INSERT command_log row (with result_payload) — LAST, after the result exists
9. COMMIT
```

The host owns every write. The module owns pure logic. No module table FKs to a platform table (ADR-012 boundary rules).

### What the module reads through

Modules do NOT get direct database access. They read through the host:

```rust
// In the module — a query
host.queries.list_samples(ListSamplesRequest {
    filter: Some(SampleFilter::StatusEquals("received".into())),
    limit: 50,
})?
// Host filters by current permissions.
// Returns Vec<SampleProjection>.
```

**Filters are structured, typed enums — never raw SQL strings.** A raw SQL filter from a module would be an authorization bypass: the module could name another module's tables or project a column it may not read.

### The same apply_event serves Users

When a User receives an event via the sync protocol, the User's host calls the same `module.apply_event(event)` to build the `proj_*` projection tables. One implementation, two contexts (Admin and User). This is what acceptance test #6 (rebuild-and-diff) proves.

---

## Migrations in the bundle

Each bundle carries `migrations/NNN.sql` files (ADR-007). The host:

1. Checks that every statement touches only `mod_<module_id>_*` tables.
2. Runs them inside the install transaction, after a pre-migration snapshot.
3. Tracks applied versions in `schema_version(scope, version)`.

For v1, migrations are split into `platform/` and `food_lab/` directories, embedded in the app binary. In Phase 6b they move into the bundle. This is how a new module creates its tables when the owner publishes it.

---

## Determinism and replay pinning

`apply_event` must be a **pure** function of the event. All non-determinism enters through `ctx`, which the host supplies: ids, timestamps, actor. A module that reads a clock or generates an id inside `apply_event` breaks replay and fails certification.

Every event carries **`module_version`** alongside `event_version`. `rebuild_projection` resolves the module build recorded on the event:

- Build available → replay through that build's `apply_event`.
- Build unavailable → run the declared `upcast_event` chain.
- No chain → **rebuild fails loudly**. It never falls back to "latest wins" and produces a plausible wrong answer.

Retained module builds exist for exactly this reason (ADR-011 lifecycle). A module version that changes `apply_event` semantics must ship an upcaster or declare its events unaffected; CI rejects a publish that does neither. Without this rule, acceptance test #6 passes trivially in v1 and silently fails after the first module update.

### Platform events and seed data

Events with `module_id = 'platform'` (for example `project.created`, `profile.created`, `tombstone.purged`, `resource.erased`, `patch.applied`) are applied by the host's built-in platform handler, inside the same single `apply_event` entry point. A module's `apply_event` is called **only** for events whose `module_id` is that module, and may touch **only** that module's `mod_<id>_*` tables.

System-initiated events (project creation, quota eviction, patches) use actor `system:<component>` and a UUIDv7 idempotency key generated by the host, and still go through the command pipeline.

Reference and seed data (standards, parameters, categories, settings defaults) is created by **events emitted from the module's `initialise` command**. It is never created by an INSERT in a migration or installer. Migrations create **empty tables only**. This is what lets replay (acceptance test #6) reproduce a project exactly.

### RowOp validation

`apply_event` returns declarative ops, never executed SQL:

```text
Insert     { table, row }
Update     { table, id, fields, expected_version }
Delete     { table, id }
SoftDelete { table, id, tombstone_payload }
```

The host validates every op before execution: table is declared in `manifest.tables` **and** carries the `mod_<id>_*` prefix; columns exist; `expected_version` matches; op count is within the per-command cap. Any failure aborts the transaction and logs a security event. The host's `apply_event` is the only executor — the module's function is a pure adviser inside it, not a second writer.

---

## Consequences

### Positive
- **Real sandbox.** Memory isolation, no syscalls outside WASI.
- **Capability-based security.** WASI Preview 2 grants are explicit.
- **Standards compliance.** Wasmtime is the WASI reference implementation. Backed by Mozilla, Fastly, Intel, Microsoft.
- **Production-proven.** Fastly Compute and Shopify Functions run Wasmtime in production; Envoy proxy filters run WASM.
- **Deterministic pure computation.** WASM execution is deterministic for a given input; host calls (DB, clock, network) are not. Replay tests record and replay host responses. We do not claim end-to-end determinism.

### Negative
- **WASM is slower than native** for compute-heavy work. Fine for business logic and host-mediated queries.
- **WASI Preview 2 tooling is still maturing.** Mitigated by writing modules in Rust.
- **Module debugging is harder.** Mitigated by captured WASI stdout/stderr and a structured error API.

### Neutral
- No WASM GC needed; Rust ownership suffices.
- No WASM threads needed; single-threaded per module.

---

## Why Wasmtime over Wasmer

| | Wasmtime | Wasmer |
|---|---|---|
| Backing | Bytecode Alliance (non-profit) | Wasmer Inc. (commercial) |
| Standards | Reference implementation, WASI P2 + Component Model | Mostly there |
| Cold start | to measure at Phase 0 | to measure at Phase 0 |
| Memory footprint | to measure at Phase 0 | to measure at Phase 0 |
| Security | Capability-based, audited | Capability-based, less battle-tested |
| Package manager | None (we run our own registry) | WAPM |
| Production proof | Fastly Compute at scale | Smaller scale |
| Licence | Apache-2.0 | MIT |

We pick Wasmtime because:
1. Security maturity matters more than peak speed for regulated data.
2. The Bytecode Alliance's track record is stronger for the long haul.
3. We do not need WAPM — the Cloud runs our module registry.
4. Apache-2.0's explicit patent grant (which MIT lacks) reduces legal risk for enterprise customers.

---

## Module loading flow

```text
1. Cloud publishes a module version: { id, version, manifest, signed_package_url }
2. Admin downloads the bundle
3. Admin runs the FULL ADR-007 verification (13 steps)
4. Admin confirms the project's licence entitlement (ADR-014)
5. Admin stores the bundle at:
     projects/{id}/modules/{module}-{version}/
6. Admin runs migrations inside the install transaction
7. Admin registers in module_registry with verification timestamps
8. On invocation:
     a. Host re-verifies signatures, expiry, licence, module access, hashes
     b. Host creates a Wasmtime Store with the manifest's capability grants
     c. Host instantiates the module
     d. Host passes a context object: typed command/query handles and a capability-granted network handle — NEVER a raw DB handle
     e. Module runs, returns a result
     f. Host tears down the Store
9. If the module has UI, the host mounts the sandboxed iframe (ADR-011)
```

Modules are short-lived per invocation by default. A module backing an open screen may stay alive while the user interacts with it.

---

## Alternatives Considered

- **Wasmer.** Rejected — see comparison table.
- **V8 isolates.** Rejected: our modules are Rust/WASI, not JS. V8 would force JS and lacks WASI capability equivalents.
- **Native sidecar binaries.** Rejected: no sandbox, one buggy module compromises the host.
- **In-process shared library (DLL/.so).** Rejected: no isolation, platform-specific, signing much harder.
- **Raw SQL filters for flexibility.** Rejected: authorization bypass.

---

## Enforcement

- The module manifest is **JSON**, canonicalised with JCS (RFC 8785). No YAML — canonical hashing requires one deterministic encoding.
- CI rejects a module without valid signatures and a complete manifest.
- Wasmtime configured with all ambient capabilities disabled.
- Lint: a module may not import a host function absent from its manifest.
- Lint: no host function accepts a SQL string, table name, or column list from a module.
- Lint: no host function hands out a database connection, file handle, or key.
- CPU budget 5 s per invocation, memory 64 MB per instance, max 4 concurrent instances (Principle 13). Exceeding kills the instance.
- Every load re-verifies.

### Tests

- [ ] Module importing an undeclared host function → build failure
- [ ] Module attempting filesystem access without a grant → denied
- [ ] Module attempting network access without a grant → denied
- [ ] Raw SQL string in a filter payload → schema rejection
- [ ] Module querying another module's tables → denied
- [ ] Module reading audit_entries or resource_keys → denied
- [ ] Infinite loop → killed at 5 s, logged
- [ ] Memory bomb → killed at 64 MB, logged
- [ ] Expired license_expiry → refuses to load
- [ ] Unsupported api_version → clean message, no crash
- [ ] YAML manifest → rejected
- [ ] Migration touching a non-mod_ table → rejected
- [ ] handle_command returns events; host assigns sequence and writes
- [ ] apply_event produces row ops; host executes them
- [ ] Same apply_event rebuilds User projection correctly