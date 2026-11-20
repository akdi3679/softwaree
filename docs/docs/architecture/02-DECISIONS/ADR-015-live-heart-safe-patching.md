# ADR-015: The Live Heart — Safe Patching

**Status:** Accepted
**Date:** 2026-11-20
**Deciders:** Architecture team
**See also:** Principle 10, ADR-005 (snapshots), ADR-007 (module bundles), ADR-011 (module lifecycle), ADR-013 (approvals), ADR-016 (data lifecycle)

---

## Context

Principle 10 lets the Cloud change logic, schema and **data** on every customer device. The owner's words: *"we may change logic or core systeme of users and can run specific sql — this is the live heart of the app."*

That is the platform's largest blast radius. One compromised signing key, or one bad patch, would reach every clinic and every lab simultaneously. Raw SQL shipped to every device is an arbitrary-code-execution channel aimed at regulated data.

The owner's intent is preserved. The mechanism is constrained.

## Decision

### 1. Typed operations, never raw SQL

A data patch is a list of **allow-listed operations**, compiled to SQL locally by the Admin:

| Op | Meaning |
|---|---|
| `set_field` | Set a column to a literal or a derived expression from a fixed expression set |
| `backfill_field` | Populate a column where it is NULL, from a declared source |
| `normalize_enum` | Map old enum values to new ones via an explicit mapping table |
| `rename_field` | Column rename with type preserved |
| `soft_delete_rows` | Move matching rows to `tombstones` (never a hard delete) |
| `reindex` | Rebuild a declared index or blind index |

- **Target allow-list:** `mod_<module>_*` tables of the patch's declared target module. Nothing else.
- **Structurally forbidden targets:** `events`, `audit_entries`, `command_log`, `resource_keys`, `erasure_ledger`, `membership_certs`, `license_state`, `mesh_peers`, `user_projections`, `schema_version`, and any other module's tables. Enforced by the compiler, not by review.
- No `DROP`, no `TRUNCATE`, no arbitrary `WHERE` expressions, no subqueries, no user-supplied SQL strings.
- The compiler is a pure function from typed ops → parameterised SQL. It is fuzzed.

### 2. Caps and dry run

- Default caps: **10,000 rows per op**, **100,000 rows per patch**. Exceeding a cap aborts before commit; raising it requires re-issuing the patch with two-person approval.
- Every patch runs a **dry run** first: it reports affected row counts and a before/after sample hash. If the dry run disagrees with the patch's declared expectation, the patch aborts and reports to the Cloud.
- The customer-facing preview is a **human-readable diff summary** ("Set `visit.status` from `open` to `closed` on 412 visits older than 2026-01-01"), not raw SQL.

### 3. Patch envelope

```json
{
  "patch_id": "patch_...",
  "patch_version": 3,
  "target_module": "medical-reception",
  "target_schema_range": [4, 6],
  "ops": [ { "op": "normalize_enum", "...": "..." } ],
  "row_cap": 10000,
  "expected_dry_run": { "affected_rows": 412, "sample_hash": "..." },
  "criticality": "critical",
  "deadline": "2026-12-01T00:00:00Z",
  "ring": "5%",
  "kill_switch": { "instruction": "halt_and_restore", "signature": "..." },
  "patch_signature": "..."
}
```

### 4. Separate offline signing key, two-person ceremony

- The **patch-signing key is separate** from the module-signing key, the licence key, and the auth service. Compromise of any of those does not enable patching.
- It is held **offline** (cold). Signing happens in a recorded ceremony: two staff, both hardware keys, both signatures over the patch hash, ceremony log retained.
- The public patch key is embedded in the app alongside the Cloud root; patches verify against it, never against a runtime-fetched key.

### 5. Ring rollout

```
ring 1:  5% of projects  → health gate
ring 2: 25% of projects  → health gate
ring 3: 100%
```

Health gates: patch failure rate, dry-run mismatch rate, post-apply verification failures, app crash rate. Any gate breach **halts the rollout automatically** and alerts ops. Ring assignment is deterministic per project id so results are reproducible.

### 6. Signed kill-switch

Every critical patch ships with a **pre-signed kill-switch instruction** (`halt_and_restore`), produced in the same ceremony. Ops can trigger it without a new signing ceremony — that is the point of pre-signing. On receipt, the Admin halts the rollout and restores the pre-update snapshot.

### 7. Deadlines and refusal

- **Critical** patches carry a deadline. If the deadline passes unapplied, the app enters **restricted mode**: read + export + print + local backup remain available; business writes are refused until the patch is applied.
  - This is a deliberate refinement of Principle 10's "refuses to start": a security deadline must never make the customer's data unreachable (Principle 14).
- **Non-critical** patches queue for 24 h. The customer may inspect the diff summary and refuse; refusal is audited and reported to the Cloud.

### 8. Atomicity, and the restore rule

```
1. Verify patch signature (offline patch key) + kill-switch signature
2. Verify target module, schema range, ring assignment
3. Acquire project lock (no new commands, drain outbox)
4. Take a pre-update snapshot into snapshots/recovery/ (ADR-005)
5. Dry run → compare to expected_dry_run
6. BEGIN; apply ops via the compiler; write audit entry with row counts; COMMIT
7. Post-apply verification
8. Release lock; broadcast affected events to Users
```

- **Pre-commit failure → rollback.** The transaction guarantees it.
- **Post-commit failure → restore from the pre-update snapshot.** Never a downgrade of schema or code.
- Schema migration precedes the logic-module swap; the previous module version is retained for restore (ADR-011).
- There is no half-updated state.

---

## Consequences

### Positive
- The owner keeps the live heart: logic and data can change on every device.
- One stolen key cannot patch the fleet; one bad patch cannot reach the fleet.
- The immutable log and audit chain are structurally out of reach of patching.
- Customers can see what a patch will do before it runs.

### Negative
- Expressiveness is limited. A genuinely novel data transformation needs a new typed op — which means a code review, which is the intended friction.
- Ceremonies and rings slow urgent releases. The kill-switch and pre-signing exist to make the fast path safe rather than to skip safety.
- The compiler is a security-critical component and must be fuzzed and audited.

### Neutral
- Typed ops are versioned; adding an op is a normal release, not a patch.
- Dry-run expectations make patches self-checking, at the cost of authoring discipline.

---

## Alternatives Considered

**Raw SQL from the Cloud.** Maximum flexibility. Rejected: it is remote code execution against medical data, with no allow-list, no caps and no meaningful review.

**Same key for modules and patches.** Rejected: one compromise would give both distribution and fleet-wide data mutation.

**Online patch key for speed.** Rejected: an internet-reachable patch key is the single highest-value target we would own.

**Big-bang rollout.** Rejected: no blast-radius containment.

**Kill-switch signed at incident time.** Rejected: during an incident is exactly when a ceremony is slowest and most error-prone.

**Refuse to start after a deadline.** Rejected as written: it holds data hostage. Restricted mode achieves the security goal without trapping the customer.

---

## Enforcement

- The compiler is the only producer of patch SQL. Lint: no `execute` of a string that arrived over the network.
- Target allow-list and forbidden-table list are constants in the compiler, covered by tests, changed only by ADR.
- CI rejects a critical patch without a pre-signed kill-switch.
- Two-person ceremony enforced in code (`approver != requester`), recorded in the owner audit chain (ADR-013).
- Ring gates are automatic; a human may halt but may not skip a gate.
- Every patch writes an audit entry with op list, row counts, dry-run result and outcome.

### Tests
- [ ] Patch targeting `events` / `audit_entries` / `command_log` → compiler refuses
- [ ] Patch targeting another module's tables → refuses
- [ ] Raw SQL string in an op payload → schema rejection
- [ ] Row cap exceeded → abort before commit, no partial state
- [ ] Dry-run mismatch → abort, report to Cloud
- [ ] Invalid patch signature → refuse
- [ ] Kill-switch triggered mid-rollout → halt + restore to pre-update snapshot
- [ ] Kill mid-patch at every step → state is always pre- or post-update, never half
- [ ] Ring gate breach → automatic halt + alert
- [ ] Critical deadline passed → restricted mode; export still works
- [ ] Non-critical refused by customer → audited, not applied
- [ ] Post-commit verification failure → restore, never downgrade