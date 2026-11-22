
03-UPDATES.md
# v1 Update System

**Status:** Locked
**Amended:** review pass 2 — Rule 3 uses restricted mode (not refuse-to-start),
`test_results` → `mod_food_lab_results`, wiring point 3 names the typed-op
compiler, Rule 2 adds `recompute_derived` for verdict fixes, patches route
through `apply_event`.

The Cloud authors changes. The client applies them. **The client is always
the writer.** This is ADR-002 applied to updates.

## Five mechanisms

| # | Mechanism        | For                                | Touches data?   |
|---|------------------|------------------------------------|-----------------|
| 1 | Code update      | UI, logic, new pages, bug fixes    | No              |
| 2 | Schema migration | Add/change tables and columns      | Yes (additive)  |
| 3 | Data patch       | Fix wrong rows                     | Yes (corrective)|
| 4 | Event rebuild    | Projection corruption              | Yes (re-derive) |
| 5 | Backup restore   | Disk loss, accidental delete       | Yes (restore)   |

1–3 are the update path. 4–5 are the recovery path. All five are wired
**and tested** in v1.

## The apply pipeline

1. Download signed artifact
2. Verify signature
3. Take a pre-change snapshot
4. Acquire the project lock (no new commands, drain in-flight work)
5. Apply in a single transaction — the compiler emits **row operations**, the
   host wraps them as `patch.applied` events and executes them through
   `apply_event`. There is no second table mutator (Principle 4, ADR-015 §3.3),
   and patches are therefore replayable by `rebuild_projection`.
6. Verify post-state
7. Write the audit entry
8. Release the lock
9. Any failure before commit → transaction rollback, log, alert

## Rule 1 — rollback after commit means restore, never downgrade

The transaction gives you atomicity **up to commit**. After commit:

- Rolling the binary back to version N while the database is at schema
  N+1 means old code meeting a newer schema. That is not supported.
- **Post-commit recovery = restore the pre-migration snapshot.**
- Therefore migrations are **expand/contract**:
  1. add the new column/table, nullable, no behavior change
  2. backfill
  3. switch reads to the new shape
  4. drop the old shape only in a later major version
- Therefore keep **N days of local snapshots** (default 7) in addition to
  the nightly Cloud backup.

## Rule 2 — correction policy for derived data and issued reports

Fixing `compute_verdict` changes **future** results. It must not silently
rewrite history:

- `mod_food_lab_results.limit_snapshot` and `verdict` are frozen at test time.
  They are the legal record of what was reported.
- A logic fix ships with a `rule_version` bump.
- To correct an existing result, emit a **`correction`** event producing a
  new `mod_food_lab_results` row with `correction_of` pointing at the original.
  The original is never updated.
- To correct an issued report, emit a **`supersede`** event producing a
  new report with `supersedes` pointing at the old one, and set the old
  report's status to `superseded`. The old PDF (stored as BLOB in the DB)
  is retained.
- A data patch may recompute verdicts **only** for rows that were never
  included in a signed report (checked via `mod_food_lab_results.is_in_signed_report = 0`),
  using the **`recompute_derived`** typed operation (big-doc ADR-015):
  the host calls the module's signed pure function (e.g., `compute_verdict`)
  on each eligible row, records before/after counts and the `rule_version`
  change in the audit entry.

This is required for ISO 17025. A lab cannot rewrite a report a client
already holds.

## Rule 3 — critical updates need a kill-switch and use restricted mode

Principle §10 lets a critical update put the app in **restricted mode**
past a deadline. This is softer than the old "refuses to start" rule and
preserves Principle 14 (data is never held hostage).

- Every critical update ships with a signed **withdraw/halt** artifact
  referencing its id.
- The app checks for withdrawal before enforcing a deadline.
- A withdrawn critical update never blocks anything, and the withdrawal
  is audited.
- **Restricted mode:** business writes refused, while read, export, print
  and local backup remain available. The UI shows a prominent banner.

## Adding and removing features

| Change                      | Mechanism                          | Data          |
|-----------------------------|------------------------------------|---------------|
| New page                    | Code update                        | No            |
| Remove a feature (soft)     | Code update, hide UI, keep data    | No            |
| Remove a feature (hard)     | Code update + contract migration   | Snapshot      |
| New network method (mesh)   | Code update, additive layer        | No            |
| New module                  | Code update + signed bundle        | No (new file) |
| Change ICMSF logic          | Code update + `rule_version` bump  | No            |
| Correct existing verdicts   | Correction events / `recompute_derived` patch | Corrective |
| Add a field                 | Expand migration                   | Additive      |

Network methods are additive because the command layer never knows *how*
a client reached it — only *that* it did. Transport sits below the command
API. Adding mDNS, WireGuard, discovery, or a relay in v1.1 adds a pipe,
not a room.

## What the Cloud must NEVER do

- Silently rewrite client files
- Push unbounded or unversioned SQL
- Push raw SQL — **only typed operations** from the allow-list
- Drop tables in the field
- Read outside the project
- Bypass signature verification
- Rewrite a signed report's history

Data patches are signed, versioned, dry-run first, transaction-wrapped,
and audited with row counts. Non-critical patches are inspectable and
refusable by the customer; refusal is audited. Critical patches are
deadline-enforced (restricted mode) and withdrawable.

## The five wiring points (must exist in v1, with tests)

1. **App updater:** `tauri-plugin-updater` with signed bundles. The updater
   signing key is offline and quorum-gated (big-doc ADR-022, THREAT-MODEL §A7).
2. **Migration runner** with pre-migration snapshot + rollback.
3. **Typed-op compiler:** signed data-patch runner that accepts only typed
   operations (`set_field`, `backfill_field`, `normalize_enum`, `soft_delete_rows`, `reindex`, `recompute_derived`; `rename_field` is not allowed), compiles them to
   parameterized SQL locally, **refuses any op touching protected tables**
   (`events`, `audit_entries`, `command_log`, `outbox`, `resource_keys`,
   `blind_indexes`, `erasure_ledger`, `membership_certs`, `license_state`,
   `mesh_peers`, `user_projections`, `schema_version`, or any table outside
   the module's own `mod_<id>_*` prefix), enforces row caps (**10,000/op,
   100,000/patch**), compares the dry run against the patch's declared
   `expected_dry_run` and aborts on mismatch, and is transactional and audited.
   Kill-switch artifacts are signed with the **offline Patch Signing Key**,
   never the App-Updater key. Ships with zero patches.
4. **`invoke('rebuild_projection')`** — replays `events` through `apply_event`
   into a scratch database. Ships with the rebuild-and-diff test.
5. **`invoke('restore_from_backup', { blob_id })`** — works on a fresh,
   empty database, re-applies the erasure ledger before writable. Ships
   with a test that restores and verifies the chain.

## After every update

Run `verify_audit_chain` and `rebuild_projection`. Both must pass. If
either fails, restore the pre-update snapshot.
