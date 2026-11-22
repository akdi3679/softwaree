# ADR-014: Licensing and Entitlements

Status: Accepted — amended 2026-11-22 (review pass 3: trial details, billing, dunning, licence-state schema, fail-closed anchor)
Date: 2026-11-20
Deciders: Architecture team
See also: ADR-005 (storage), ADR-007 (signatures), ADR-021 (plans)

## Context

Entitlements must be enforced by what the Cloud will sign, never by if plan == X in the client. Furthermore, the offline grace period must be secure against clock tampering, including clock rollback via backup restoration.

## Decision

### 1. Entitlements are signatures

A capability exists only if the Cloud will sign a licence, a module bundle, or a membership certificate granting it. The client verifies the signature; it does not evaluate plan rules.

### 2. The Licence

Plans are data; the record schema is defined once in **ADR-021**. The Admin caches the signed licence and enforces limits **from the signed payload**, never from a hardcoded table or a local setting.

| State | Trigger | Behaviour |
|---|---|---|
| Active | signed licence, `valid_until` in the future (TTL 30 days) | full operation |
| Refreshing | any Cloud contact (target every 7 days) | licence re-issued, anchor updated |
| Grace | `valid_until` passed, ≤ 14 days | full operation + prominent banner |
| Read-only | grace exhausted, or billing suspended past dunning | allow-list below |
| Plan 1 | perpetual local licence (`license_expiry = null`) | never expires after activation |
| Bootstrap | never activated, ≤ 30 days from first launch | standard modules only, zero Users (ADR-023) |

**Read-only allow-list (always works):** read all existing data; **export** any project in open formats; print / generate PDFs of existing records; take a **local** backup; verify the audit chain.
**Denied in read-only:** create, update, delete, **restore from corbeille** (a restore is a write), module install, inviting users, Cloud backup upload.

Data is never deleted, encrypted away, or made unexportable because of money (Principle 14).

### 2.1 Trial

**14 days of the selected plan**, no card required. At the end: subscribe, or read-only. Trial data is kept and exportable indefinitely. The trial is not a fixed feature set — v1-foodlab trials **Plan 1+**, not Plan 3.

### 2.2 Billing and dunning

Payment goes through the **provider interface** (`03-STACK §A.1`); the provider choice is D-3. Webhook handlers are idempotent and signature-verified; a replayed webhook changes nothing.

Dunning: failed payment → retry at **day 1, 3, 7**, email at each step → **day 14 read-only**. Nothing is deleted. A successful payment restores full operation on the next licence refresh. If the chosen PSP has no recurring support, v1 uses **prepaid periods + manual renewal**, which fits the TTL model with no design change.

### 2.3 Downgrade behaviour

| Over-limit item | Behaviour |
|---|---|
| Users above the new limit | Admin picks who stays active; the rest become read-only members. **Nobody is deleted.** |
| Projects above the new limit | Admin picks one active project; others read-only and exportable. |
| Custom module no longer entitled | Module disabled; tables retained and exportable (ADR-011). |
| Backup quota exceeded | Oldest backups rotate per retention; customer warned first. **Local backup is never blocked.** |


### 3. The Monotonic Clock Anchor (Moved to Device-Level)

To enforce the grace period offline, the app maintains a monotonic clock anchor.
Crucially, this anchor and the license_state cache live in the device-level admin_state.db, NOT in the project-level project.db (ADR-005).

Why? If the anchor lived in project.db, a customer could restore an old backup (from before the licence expired) and roll the clock anchor back, artificially extending the grace period. By keeping it in admin_state.db (which is not captured in project backups), a restore cannot roll back the licence state.

Schema in admin_state.db:

   CREATE TABLE license_state (
  project_id         TEXT PRIMARY KEY,
  plan_id            TEXT NOT NULL,
  plan_version       INTEGER NOT NULL,
  licence_jcs        TEXT NOT NULL,   -- the signed licence payload, JCS
  licence_sig        TEXT NOT NULL,   -- Ed25519, per-project licence key
  license_expiry     TEXT,            -- NULL only for a Plan 1 perpetual licence
  state              TEXT NOT NULL,   -- active|refreshing|grace|read_only|perpetual|bootstrap
  monotonic_anchor   TEXT NOT NULL,   -- anchor value, RFC 3339
  anchor_elapsed_ms  INTEGER NOT NULL DEFAULT 0,
  last_seen_cloud_time TEXT,          -- last signed Cloud timestamp
  anchor_source      TEXT NOT NULL,   -- 'cloud' | 'activation_file' | 'unknown'
  updated_at         TEXT NOT NULL
);

license_expiry is nullable because a Plan 1 perpetual licence has no expiry. last_seen_cloud_time is stored because trusted_now reads it. licence_jcs + licence_sig are stored because the licence must be verified locally, not merely remembered.
** custody of admin_state.db:** it is SQLCipher-encrypted with its own random key in the OS keychain; it is excluded from project backups by an explicit allow-list; and it carries a monotonic revision counter so a rolled-back or deleted file is detected and treated as expiry-unknown.
New-device anchor seeding: a replacement device has no anchor history. It seeds monotonic_anchor from the signed licence's issued_at, sets anchor_source = 'cloud', and treats the project as grace-bounded until the first Cloud contact. It never seeds from the wall clock, and never from restored project data.


Clock tampering defense:
trusted_now = max(last_seen_cloud_time, anchor + elapsed_local_time)

elapsed_local_time is defined as: accumulated monotonic running time while the app is open, PLUS forward wall-clock deltas (capped at 24 hours per session) while the app is closed. This prevents a user from gaining idle time by rolling the clock back while the app is closed.

Fail-closed rule: If the anchor file or row is deleted, the app treats it as expiry-unknown and immediately enters read-only mode (fail-closed). Deleting the anchor repeatedly cannot grant endless grace. The last audit-chain timestamp serves as a secondary floor.


## Consequences

Positive:
- Entitlements cannot be bypassed by patching the client.
- Restoring an old backup does not extend the licence grace period.
- The customer's data is never held hostage (export always works).
- The anchor is fail-closed, preventing endless grace via deletion.

Negative:
- admin_state.db must be managed separately from project backups.
- elapsed_local_time requires tracking monotonic time across app restarts.

## Enforcement
Lint: no client code branches on a plan id or plan name for a capability decision.
Lint: no project-operation handler reads a Cloud session token.
Lint: license_state and the clock anchor are never written to project.db.
The licence verification function is the only reader of license_state; the anchor update function is the only writer.
Quotas and limits are read from the verified licence payload. Lint: no quota constant is read from a local settings table.
The read-only allow-list is enforced at the command-handler boundary.
Every export path is reachable in every billing state — CI asserts export works in active, grace, read_only, restricted, bootstrap, perpetual.
Webhook handlers are idempotent and signature-verified.
Plan edits require quorum approval and are audited (ADR-013).
Tests
Licence expired, ≤14 days → grace: full operation + banner
Grace exhausted → read-only allow-list enforced; restore from corbeille denied
Clock rolled back one year → expiry still enforced
Restore an old backup → license_state unchanged; grace does not extend
admin_state.db deleted or rolled back → expiry-unknown → grace → read-only
admin_state.db opened without its keychain key → fails
New device is read-only until first Cloud contact; anchor seeded from the signed Cloud time
Plan 1 perpetual licence with license_expiry = NULL → loads and never expires
Payment succeeds after suspension → full operation on next refresh
Replayed billing webhook → no state change
Downgrade with 12 users on Plan 3 → 10 active, 2 read-only, zero deletions
Patched client claims Plan 4 → Cloud refuses to sign custom-module bundles
New plan created in the Console → assignable with no code change
Trial of Plan 1+ grants Plan 1+ limits, not Plan 3 limits
- [ ] Trial of Plan 1+ grants Plan 1+ features for 14 days
- [ ] Payment failure -> Grace period applies after TTL expires