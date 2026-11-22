# ADR-015: Live Heart — Safe Patching for Data and Logic

Status: Accepted — amended 2026-11-22 (review pass 3: signing ceremony, row caps, key mapping, rename_field removed, manifest frozen_when rule)
Date: 2026-11-20
Deciders: Architecture team
See also: ADR-005 (storage), ADR-006 (runtime), ADR-010 (updates), Principle 10

## Context

The Cloud must be able to push updates to all Admin devices: app updates, core updates, module updates, schema migrations, data patches, and logic changes. These updates must be signed, versioned, atomic, reversible, and safe.

## Decision

### 1. The update pipeline

Every update follows this pipeline:
1. Discover (Cloud advertises new version)
2. Download (Admin fetches signed artifact)
3. Verify signature (Admin checks Cloud signature)
4. Snapshot (Admin takes pre-update snapshot of project.db)
5. Acquire lock (no new commands, drain outbox)
6. Dry run (if applicable, simulate the update)
7. Apply (in a single transaction, via apply_event — see §3.3)
8. Verify post-state (run acceptance tests)
9. Commit (or rollback if any step fails)
10. Release lock
11. Broadcast affected events to Users (if state-affecting)

### 2. Key-to-update-type mapping

Each update type is signed by a specific key. The mapping is fixed:

- App update (binary): Signed by App-Updater Signing Key (Offline / cold, quorum-gated).
- Data patch (typed ops): Signed by Patch Signing Key (Offline / cold, quorum-gated).
- Module (logic + UI): Signed by Module keys (root + licence + bind) per ADR-007.
- Schema migration (DDL): Signed by App-Updater Signing Key (shipped with app).
- Core update (host API): Signed by App-Updater Signing Key.

Platform schema changes arrive as part of app updates (signed by the updater key). Module schema changes arrive in the module bundle (signed per ADR-007). There is no separate "schema signing key".

### 3. Data patches: typed operations, never raw SQL

The owner wants to "run specific SQL" on all Admin devices. We honor this intent as typed, allow-listed operations compiled to SQL locally by the Admin. Never raw SQL from the Cloud.

Allowed operations:
- set_field (table, field, value, where)
- backfill_field (table, field, source_field)
- normalize_enum (table, field, mapping)
- soft_delete_rows (table, where)
- reindex (table)
- recompute_derived (module_id, function, where, frozen_when)

rename_field is NOT an allowed operation. Renaming a column breaks the expand/contract rule. Instead, implement rename as:
1. backfill_field to copy old column to new column.
2. Code update to read from new column.
3. Later app update to drop old column (in a subsequent major version).

The typed-op compiler enforces a row cap (default 10,000 rows per op; configurable per patch). Exceeding the cap fails the dry run.

recompute_derived operation:
- Calls a signed pure function exported by the module (e.g., compute_verdict).
- Only runs on rows never included in a signed report, checked via mod_food_lab_results.is_in_signed_report = 0 (set by apply_event from the report's frozen included_results — there is no FK). Rows inside a signed report are corrected by new rows, never recomputed (ADR-016 §6).
- Records before/after counts and the rule_version change in the audit entry.

3.1 Caps, dry-run expectations, and the patch envelope
Default caps: 10,000 rows per op, 100,000 rows per patch. Exceeding a cap aborts before commit. Raising it requires re-issuing the patch with quorum approval.
Every patch declares expected_dry_run. If the dry run disagrees, the patch aborts and reports to the Cloud.
No arbitrary WHERE expressions, no subqueries, no user-supplied SQL strings. Filter is a typed enum.
{
  "patch_id": "patch_...",
  "patch_version": 3,
  "target_module": "food-lab",
  "target_schema_range": [4, 6],
  "ops": [ { "op": "normalize_enum", "...": "..." } ],
  "row_cap": 10000,
  "expected_dry_run": { "affected_rows": 412, "sample_hash": "..." },
  "criticality": "critical",
  "deadline": "2026-12-01T00:00:00Z",
  "rule_version_from": 1,
  "rule_version_to": 2,
  "kill_switch": { "instruction": "halt_and_restore", "signature": "..." },
  "patch_signature": "..."
}

Rollout state is not in the envelope (§5), so advancing a ring never requires re-signing.
3.2 Separate offline patch-signing key
The Patch Signing Key is separate from the Cloud root, the signing-service key, the per-project licence key, the auth service, and the App-Updater Signing Key. Compromise of any of those does not enable patching.
Held offline / cold. Signing happens in a recorded ceremony: quorum approval (ADR-013), hardware keys, signatures over the patch hash, ceremony log retained.
The public patch key is embedded in the app alongside the Cloud root. Patches never verify against a runtime-fetched key.
The pre-signed kill-switch is produced in the same ceremony, with the same patch key, so ops can halt without a new ceremony.
3.3 Patches go through apply_event
The compiler produces row operations, not executed SQL. The host wraps them as patch.applied events and executes them through the single apply_event function (Principle 4). There is no second table mutator, and patches are therefore replayable by rebuild_projection.
### 4. Critical updates: restricted mode, not refuse-to-start
Critical updates (security patches, data corruption fixes) have a deadline. If the deadline passes unapplied, the app enters restricted mode:
- Business writes are refused.
- Reading, exporting, printing, and local backup remain available.

Kill-switch:
- Every critical update ships with a signed withdraw/halt artifact referencing its id.
- The kill-switch is PRE-SIGNED at the patch-signing ceremony, not signed later. This guarantees it exists even if the signing key is later compromised or unavailable.
- The app checks for withdrawal before enforcing a deadline.

### 5. Ring rollouts (blast radius control)

Updates are rolled out in rings (5% -> 25% -> 100%). Rollout state lives on the Cloud side, not in the signed envelope.
Rollout state on Cloud side → no re-signing needed to advance rings
Row cap exceeded → abort before commit, no partial state
Dry run disagrees with expected_dry_run → abort, report to Cloud
Invalid patch signature → refuse; runtime-fetched key never trusted
Kill-switch signed by the updater key instead of the patch key → refused
Patch row ops executed outside apply_event → lint failure
recompute_derived on a row with is_in_signed_report = 1 → refused
Patch applied → rebuild_projection reproduces the post-patch state

### 6. Signing ceremony

Every patch and app update is produced by a signing ceremony:
1. The patch or update is authored and reviewed in a PR.
2. The PR is approved by the required reviewers.
3. A ceremony is scheduled with the required quorum of approvers (per ADR-013).
4. Each approver authenticates with their hardware key.
5. Each approver reviews the patch contents and the dry-run output.
6. Each approver signs the artifact with the offline signing key.
7. The signed artifact is uploaded to the Cloud's update registry.
8. The kill-switch artifact is pre-signed in the same ceremony.
9. The ceremony is recorded in the platform audit chain (ADR-013).

### 7. Non-critical updates: inspectable and refusable

Non-critical updates are queued for 24 hours. The customer may inspect a human-readable diff summary and refuse (refusal is audited), or apply immediately.

## Consequences

Positive:
- Updates are atomic, verified, and reversible.
- Data patches are safe: typed operations, protected tables, mandatory dry run, row caps.
- Critical updates have a pre-signed kill-switch and restricted mode.
- Ring rollouts bound blast radius.

Negative:
- rename_field requires two app releases. Accepted: expand/contract is worth it.
- Signing ceremonies require coordination. Accepted: quorum approval is the point.

## Enforcement

- The patch compiler is the only path that executes data patches.
- Lint: rename_field is not in the allow-list.
- Row cap is enforced in the compiler; exceeding it fails the dry run.
- Kill-switch artifacts are signed with the offline Patch Signing Key, in the same ceremony as the patch — never with the App-Updater Signing Key, a module key, or a licence key (ADR-022). One key, one purpose.
Row caps and expected_dry_run are enforced by the compiler, not by review.
The compiler emits row operations; only apply_event executes them. Lint: no patch path calls execute directly.
Quorum ceremony enforced in code and recorded in the owner audit chain (ADR-013).

Tests:
- [ ] Patch with raw SQL -> rejected by compiler
- [ ] Patch with rename_field -> rejected
- [ ] Patch exceeding row cap -> rejected at dry run
- [ ] Kill-switch pre-signed at ceremony (exists before patch is shipped)
- [ ] recompute_derived only runs on rows satisfying frozen_when rule