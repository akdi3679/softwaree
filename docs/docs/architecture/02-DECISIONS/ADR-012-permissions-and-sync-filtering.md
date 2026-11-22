# ADR-012: Permissions, Membership Certificates, Sync Filtering, and Resource-Key Delivery

**Status:** Accepted — amended 2026-11-20 (review pass 2)
**Date:** 2026-11-20
**Amended:** added `profiles` table, removed `license_state` (moved to device-level `admin_state.db`), defined table classes for Test #6 precision.
**Deciders:** Architecture team
**See also:** ADR-004 (sequence), ADR-005 (storage + admin_state.db), ADR-008 (snapshots), ADR-010 (auth), ADR-011 (module versions), ADR-016 (erasure), ADR-022 (keys), SYNC-PROTOCOL

---

## Context

This ADR closes the gaps that filtering alone leaves open, defines the exact platform tables, and specifies how crypto-shredding composes with sync:

1. Granting access later must deliver the history.
2. Revoking access must remove data and keys already on the User's disk.
3. The Cloud going down must not stop the project.
4. The permission model itself must be defined.
5. **Sensitive data is encrypted per-resource. An authorized User must obtain the key to read it, and lose it on revocation.**

## Decision

### 1. Permission model

A permission is `module.resource.action` (e.g., `food-lab.sample.create`).
- v1 grants are per **resource type**. Row-level scoping is deferred.
- Actions: `read`, `create`, `update`, `delete`, `restore`, `export`, plus module-declared actions.
- `*` is allowed in the **action** position only.
- Effective permission = **union of all roles** the member holds, evaluated against the live tables on every decision (Principle 5).
- `module.access` is separate: it decides whether a bundle may be issued and loaded at all.

### 2. Membership certificates

- The Cloud signs a **membership certificate** per member device and an **Admin authority certificate** per project.
- The **Admin** verifies each User's certificate against the embedded Cloud root, then enforces its own live role tables.
- **Cloud sessions gate Cloud API calls only.** Project operation never checks a Cloud session.
- **Revocation is local and immediate.** The Admin records it locally; it takes effect on the next operation.

### 3. Grant → backfill & Revoke → purge

- **Grant:** Admin bumps `permission_version`, invalidates caches, computes a **partial backfill snapshot** (`scope: "partial"`) of newly authorised resources at sequence S, including wrapped resource keys.
- **Revoke:** Admin bumps `permission_version`, sends a **Purge** frame. The User deletes projection rows **and local key copies** in one transaction. Purges carry a per-member monotonic `purge_version`; the User acks the highest contiguous `purge_version` applied.

### 4. Resource-key delivery

- **The Admin never sends a resource key in plaintext.** It wraps the key to the **recipient member's X25519 public key** and attaches the wrapped key to the delivery (`key_wraps` in `EventBatch`, `keys` in `SnapshotPayload`).
- The User unwraps with its X25519 private key and stores the plaintext key in its encrypted projection key store.
- On revoke/erasure, the User deletes the rows **and** its local copy of the key.

### 5. Table classes (for Test #6 precision)

To prove v1 is a true subset of the final architecture (Acceptance Test #6: rebuild-and-diff), tables are strictly classified:


1. **Projected business tables** — change *only* via `apply_event`, and **are** reproduced by replay:
`mod_*`, `project_meta`, `profiles`, `tombstones`, `roles`, `role_permissions`, `member_roles`, `erasure_ledger`.
2. **Log tables** — append-only: `events`, `audit_entries`, `command_log`, `outbox`.
3. **Host-state tables** — not replayed from events:
`module_registry`, `schema_version`, `resource_keys`, `blind_indexes`, `membership_certs`, `user_projections`, `mesh_peers`.

**Why roles and the erasure ledger are Projected.** Role changes are business events — ADR-004's own example log contains `1005: RoleGranted(U3, patient.read)`, which UserA applies. If `member_roles` were host-state, replay could not reproduce it and a User could never project a role change. Erasure likewise emits `resource.erased`; the ledger entry is a business fact and must replay.

**Why `resource_keys` and `blind_indexes` stay Host-state.** Erasure requires destroying a resource key **irrecoverably**. If the wrapped key were carried in the immutable event log, replay would resurrect it and crypto-shredding would be void. So keys are generated at command time and never enter `events`. Replay still reproduces the business tables exactly, because sensitive fields are **ciphertext copied through** — `apply_event` needs no key to write them. A rebuilt database holds ciphertext it cannot decrypt; that is correct for a diff test, and real recovery restores from a backup (which carries the keyring), not from replay. Blind indexes are HMACs over plaintext and are likewise not re-derivable from ciphertext.

**Purge and eviction are events.** Quota-driven hard delete emits `tombstone.purged`; erasure emits `resource.erased`. Both go through `apply_event`. A silent `DELETE` would make `tombstones` diverge on replay and break test #6.

**Outbox pruning is the one append-only exception.** `outbox` is delivery bookkeeping, not a record. Pruning `status='skipped'` rows older than 30 days is permitted and is excluded from the test #6 diff. `events`, `audit_entries` and `command_log` are never pruned.
---

## Platform tables (final list: 18 Admin / 6 User)

These live **inside each `project.db`**. Device-level state (like the clock anchor and license cache) lives in `admin_state.db` (ADR-005, ADR-014).

**Admin — 18 platform tables**


| # | Table | Class | Purpose |
|---|---|---|---|
| 1 | `project_meta` | Projected | The four creation fields, project id, settings |
| 2 | `events` | Log | Append-only global sequence; state deltas |
| 3 | `outbox` | Log | Pending delivery work |
| 4 | `audit_entries` | Log | Hash-chained audit (writes + sensitive reads) |
| 5 | `command_log` | Log | Idempotency keys and results |
| 6 | `tombstones` | Projected | Soft-deleted records (corbeille) |
| 7 | `resource_keys` | Host-state | Per-resource content keys |
| 8 | `blind_indexes` | Host-state | HMAC search tokens for encrypted fields |
| 9 | `erasure_ledger` | Projected | Permanent record of crypto-shredded resources (`resource.erased`) |
| 10 | `module_registry` | Host-state | Installed modules, versions, signatures, `bundle_kind` |
| 11 | `roles` | Projected | Role catalogue |
| 12 | `role_permissions` | Projected | Role → permission strings |
| 13 | `member_roles` | Projected | Member → roles (authoritative revocation record) |
| 14 | `profiles` | Projected | Member directory (id, email, name). Replaces `license_state` in the 18-table count. |
| 15 | `membership_certs` | Host-state | Cloud certificates + local revocations |
| 16 | `user_projections` | Host-state | Per member: cursor, permission_version, purge acks |
| 17 | `mesh_peers` | Host-state | Device pubkeys, virtual IPs, endpoints |
| 18 | `schema_version` | Host-state | Forward-only migration state |


**User — 6 platform tables**

| # | Table | Purpose |
|---|---|---|
| 1 | `sync_state` | Project id, Admin pubkey, cursor, permission_version, purge acks |
| 2 | `inbox` | Received events awaiting apply |
| 3 | `outbox` | Reserved for v2 offline queue (never written in v1) |
| 4 | `module_registry` | Installed modules (read-only view) |
| 5 | `membership_state` | Own membership cert + Admin authority cert |
| 6 | `schema_version` | Forward-only migration state |

*(Note: The User's received resource keys live in a `proj_resource_keys` projection table, not a platform table.)*

---

## Consequences

### Positive
- Grants deliver data and keys; revokes remove data and keys.
- Cloud outages do not stop the project.
- Filtered streams are unambiguous (every gap has a reason).
- Encryption, filtering, and erasure compose into one coherent model.
- Table classes make the rebuild-and-diff test mathematically precise.

### Negative
- Permission changes cost a snapshot computation and key re-wrapping.
- Purge is best-effort and must be described honestly.

---

## Enforcement

- No delivery path sends an event without a current-permission check.
- Every permission mutation bumps `permission_version` and invalidates caches **before** acknowledgement.
- Lint: no User code path writes business tables.
- Lint: no project-operation handler reads a Cloud session token.
- Lint: no resource key is transmitted in plaintext.
- CI check: table counts are **scope-explicit**. Final architecture: **18 platform tables in `project.db` + 6 User platform tables**, plus `mod_*` / `proj_*`. v1-foodlab: **10 platform + 9 module = 19 total**. These are two different assertions; a single unscoped "18" produces a false green.
- `license_state` is defined in ADR-014 and lives in `admin_state.db`. It is not one of the 18 and is never counted as a project table.
- Lint: no patch, maintenance or eviction path issues a bare `DELETE` on a Projected table. Every removal is an event through `apply_event`.

### Tests
- [ ] Grant → partial backfill delivers rows **and keys**
- [ ] Revoke → purge removes rows **and local key copies**
- [ ] Cloud offline 60 minutes → reads and writes continue
- [ ] Denied events → explicit skips, cursor at range end
- [ ] Table counts match 18 Admin / 6 User
- [ ] Test #6 (rebuild-and-diff): replaying `events` through `apply_event` reproduces all *Projected business tables* exactly.

