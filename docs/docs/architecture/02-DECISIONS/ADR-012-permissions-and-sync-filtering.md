# ADR-012: Permissions, Membership Certificates, Sync Filtering, and Resource-Key Delivery

**Status:** Accepted — amended 2026-11-20 (gap-fix pass)
**Date:** 2026-11-20
**Deciders:** Architecture team
**See also:** ADR-004 (sequence), ADR-008 (snapshots), ADR-009 (no offline writes), ADR-010 (auth), ADR-011 (module versions), ADR-014 (licensing), ADR-016 (erasure), ADR-022 (keys), SYNC-PROTOCOL

---

## Context

ADR-004 defined delivery-time filtering. This ADR closes the gaps that filtering alone leaves open, including the one that makes crypto-shredding actually work:

1. Granting access later must deliver the history, not an empty view.
2. Revoking access must remove data already on the User's disk.
3. The Cloud going down must not stop the project.
4. The permission model itself must be defined.
5. **Sensitive data is encrypted per-resource (ADR-016). An authorized User must be able to obtain the key to read it — and lose it on revocation/erasure. Without this rule, encryption and filtering do not compose.**

## Decision

### 1. Permission model

A permission is `module.resource.action`:

```
medical-reception.patient.read
medical-reception.appointment.update
food-lab.result.approve
```

- v1 grants are per **resource type**. Row-level scoping is deferred behind a future ADR; the evaluation function takes a scope argument so it can be added without reshaping the model.
- Actions: `read`, `create`, `update`, `delete`, `restore`, `export`, plus module-declared actions (e.g. `approve`).
- `*` is allowed in the **action** position only. No wildcards in module or resource positions in v1.
- Effective permission = **union of all roles** the member holds, evaluated against the live tables on every decision (Principle 5).
- `module.access` is separate: it decides whether a bundle may be issued and loaded at all.

**Who knows what:**

| Fact | Admin | Cloud |
|---|---|---|
| Role catalogue and permission lists | ✅ authoritative | ❌ never |
| Member → role IDs | ✅ | ✅ (IDs only) |
| Member → module-access list | ✅ authoritative | ✅ (synced copy, for bundle issuance) |
| Per-resource permission decisions | ✅ | ❌ |

### 2. Membership certificates — why the Cloud can go down

- The Cloud signs a **membership certificate** per member device: `{cert_id, project_id, account_id, device_pubkey, role_ids[], module_access[], issued_at, valid_until (90 days), revocation_epoch, cloud_signature}`.
- The Cloud signs an **Admin authority certificate** per project: `{project_id, admin_device_pubkey, issued_at, valid_until (90 days), revocation_epoch, cloud_signature}`.
- The **Admin** verifies each User's certificate against the embedded Cloud root, then enforces its own live role tables. The **User** verifies the Admin authority certificate so it knows it is talking to the real Admin.
- **Cloud sessions gate Cloud API calls only.** Project operation never checks a Cloud session.
- **Revocation is local and immediate.** The Admin records it in `membership_certs`; it takes effect on the next operation. The Cloud's `revocation_epoch` bumps when the Admin next syncs.
- Validity maths: certificates last 90 days; a licence lasts 30 days with a 14-day grace (ADR-014). The licence grace is always shorter than certificate validity, so during a Cloud outage the licence state — not certificate expiry — is the binding constraint. Plan 1 holds a perpetual local licence and zero Users.

### 3. Grant → backfill

When a member gains a permission covering resources they have never received:

```
1. Admin bumps the member's permission_version
2. Admin invalidates every cached snapshot for that member (ADR-008)
3. Admin computes a PARTIAL BACKFILL snapshot of exactly the newly authorised
   resources at the current sequence S (scope = "partial")
4. Admin sends SnapshotPayload { scope: "partial", granted_resources: [...] },
   including the wrapped resource keys for those resources (§5)
5. User applies it additively in one transaction, sets cursor = S
6. Normal delta delivery resumes from S + 1
```

Without step 3 a grant is a lie: the UI shows a permission the data does not reflect.

### 4. Revoke → purge

```
1. Admin bumps permission_version, invalidates cached snapshots
2. Admin records the revocation locally (membership_certs / member_roles)
3. Admin sends Purge { purge_version, scope, resources, signature }
4. User deletes the matching projection rows AND the local copies of those
   resources' keys (§5) in one transaction, drops its own cached snapshots,
   and advances its acked_purge_version
5. If module access was revoked: module_registry marked revoked, bundle +
   unwrapped content key deleted, frames closed (ADR-011)
6. If membership was revoked: Purge { scope: "all" }, session closed,
   certificate revoked locally, Cloud epoch bumps on next sync
```

Purges carry a per-member monotonic **`purge_version`**. The User acks the highest contiguous `purge_version` it has applied, via `acked_purge_version` in its next `SyncRequest`. Multiple pending purges are therefore all covered — acking only "the latest" is not sufficient.

**Honest limit:** purge is best-effort. We cannot un-see data already displayed, and we cannot reach a device that never reconnects. What we guarantee: no further delivery, deletion of rows **and keys** on next contact, and an audited revocation record.

### 5. Resource-key delivery (this is what makes crypto-shredding compose with sync)

Sensitive payloads and sensitive projection fields are encrypted with a **per-resource content key** (ADR-016, ADR-022). The Admin is the key authority. The rule:

- **The Admin never sends a resource key in plaintext.** It wraps the key to the **recipient member's X25519 public key** and attaches the wrapped key to the delivery.
- Delivery is per-member, so wrapping is per-member:
  - In an `EventBatch`, each sensitive event carries `key_wraps` for that member.
  - In a `SnapshotPayload`, a `keys` section carries the wrapped key for every sensitive resource in the snapshot.
- The User unwraps with its own X25519 private key, stores the plaintext resource key in its encrypted projection key store, and uses it to decrypt rows.
- On revoke/erasure, the User deletes the rows **and** its local copy of the resource key (step 4 above). Destroying the Admin's master key plus every distributed copy is what shredding means.

This means:
- A member who loses authorization can no longer decrypt, because its key copy is purged.
- Erasure (ADR-016) destroys the Admin's master key; combined with the purge of member copies, the ciphertext everywhere becomes unreadable.
- The Cloud never holds a resource key. Keys travel only Admin → authorised member, wrapped.

### 6. Delivery: range batches

Every `EventBatch` declares `range_start` and `range_end` — "everything you may see in this range is here."

- The cursor advances to `range_end` after the batch is applied.
- Events inside the range that were not delivered are recorded as explicit skips with a reason: `denied` or `module_incompatible` (ADR-011).
- A gap inside a delivered range means "not authorised" or "module update needed", never "lost".
- The cursor never advances past a range it has not received.
- `permission_version` accompanies every batch; a newer value tells the User a permission change occurred and to expect a backfill or purge.

### 7. Writes: one round trip

```
User → CommandRequest { command, idempotency_key, expected_version }
Admin: validate → authorise → apply in ONE transaction
       (event + apply_event + audit + outbox)
Admin → CommandResponse { applied_sequence } | typed error
User: waits until its projection cursor reaches applied_sequence.
      It never applies the write locally.
```

- **Optimistic concurrency only.** Stale `expected_version` → `ConflictError` with the current version. No last-write-wins, no auto-merge.
- **Idempotency.** `command_log` stores the key and result; a retry returns the original outcome.
- Typed errors: `ValidationError`, `AuthorizationError`, `ConflictError`, `ModuleVersionMismatch`, `AdminOffline`.
- "Saved on Admin — updating your view" is projection lag, not a pending write (ADR-009).

---

## Platform tables (final list)

These live **inside each `project.db`** — project-scoped, never shared across projects (ADR-005). Module business tables use the `mod_<name>_*` prefix and are not platform tables.

**Admin — 18 platform tables**

| # | Table | Purpose |
|---|---|---|
| 1 | `project_meta` | The four creation fields, project id, created_at, settings |
| 2 | `events` | Append-only global sequence; state deltas (sensitive payloads encrypted) |
| 3 | `outbox` | Pending delivery work, same transaction |
| 4 | `audit_entries` | Hash-chained audit (writes + sensitive reads) |
| 5 | `command_log` | Idempotency keys and their results |
| 6 | `tombstones` | Soft-deleted records (the corbeille) |
| 7 | `resource_keys` | Per-resource content keys, wrapped by the Project Keyring Key (ADR-016) |
| 8 | `blind_indexes` | HMAC search tokens for encrypted sensitive fields, keyed by resource (ADR-016) |
| 9 | `erasure_ledger` | Permanent record of crypto-shredded resources (ADR-016) |
| 10 | `module_registry` | Installed modules, versions, verification timestamps, state |
| 11 | `roles` | Role catalogue |
| 12 | `role_permissions` | Role → permission strings |
| 13 | `member_roles` | Member → roles |
| 14 | `membership_certs` | Cloud certificates + local revocations |
| 15 | `user_projections` | Per member: cursor, permission_version, module_versions, acked_purge_version |
| 16 | `mesh_peers` | Device pubkeys (Ed25519 + X25519), virtual IPs, last-known endpoints |
| 17 | `license_state` | Cached signed licence + monotonic clock anchor (ADR-014) |
| 18 | `schema_version` | Forward-only migration state |

**User — 6 platform tables**

| # | Table | Purpose |
|---|---|---|
| 1 | `sync_state` | Project id, Admin pubkey, cursor, permission_version, acked_purge_version |
| 2 | `inbox` | Received events awaiting apply |
| 3 | `outbox` | Reserved for the v2 offline queue — **never written in v1** |
| 4 | `module_registry` | Installed modules and versions (read-only view) |
| 5 | `membership_state` | Own membership certificate + Admin authority certificate |
| 6 | `schema_version` | Forward-only migration state |

Projection tables on the User use the `proj_*` prefix and are rebuildable. The User's received resource keys live in a `proj_resource_keys` projection table (encrypted at rest by the projection DB), not a platform table.

**Clarification vs ADR-005:** per-member cursors live in `user_projections` inside `project.db`, because they must be transactional with `events` and `outbox`. The separate app-level registry file holds only the project list and app preferences — not cursors.

---

## Consequences

### Positive
- A grant delivers data; a revoke removes data **and keys**.
- A Cloud outage does not stop the project.
- Filtered streams are unambiguous: every gap has a declared reason.
- Encryption, filtering, and erasure compose into one coherent model.
- One write path, one apply path, one conflict rule.
- The table list is countable, so docs and code can be reconciled.

### Negative
- Permission changes cost a snapshot computation, a cache invalidation, and key re-wrapping.
- Purge is best-effort and must be described honestly rather than sold as guaranteed erasure of memory.
- Certificate issuance adds enrolment work and a 90-day renewal path.
- Per-member key wrapping adds work at delivery time. Bounded: one wrap per sensitive resource per recipient.

### Neutral
- `permission_version` and `purge_version` are per-member monotonic counters.
- Row-level scoping is a future ADR, not a redesign.

---

## Alternatives Considered

**Filter at delivery only.** Rejected: grants show empty history; revokes leave data and keys on disk.

**Per-user event streams.** Rejected in ADR-004.

**Require a fresh Cloud session for project operations.** Rejected: a 15-minute Cloud outage would stop every clinic.

**Trust the certificate's `role_ids` as the permission source.** Rejected: the Cloud must not hold permission lists, and roles change while offline.

**Deliver resource keys through the Cloud.** Rejected: keys must never touch the Cloud. Admin → member only, wrapped.

**Last-write-wins for simplicity.** Rejected: silent overwrites are unacceptable for medical and lab records.

---

## Enforcement

- No delivery path may send an event without a current-permission check.
- No cache hit without a `permission_version` match.
- Every permission mutation bumps `permission_version` and invalidates caches **before** the change is acknowledged.
- Lint: no User code path writes business tables; the only projection writer is `apply_event` / snapshot apply.
- Lint: no project-operation handler may read a Cloud session token.
- Lint: no resource key is ever transmitted in plaintext; every key transfer goes through the wrap-to-X25519 function.
- The bridge and command handler share one authorisation function — no second implementation.

### Tests
- [ ] Grant → partial backfill delivers previously unseen rows **and keys**
- [ ] Revoke → purge removes rows **and local key copies**; cached snapshots deleted
- [ ] After revoke, the member cannot decrypt the resource even from an old local copy it failed to delete (key destroyed on Admin)
- [ ] Module access revoked → bundle and content key deleted, frames closed
- [ ] Cloud offline for 60 minutes → Admin and User keep reading and writing
- [ ] Admin revokes a member while Cloud is offline → denied on next operation
- [ ] Forged membership certificate → refused locally
- [ ] Forged Admin authority certificate → User refuses to sync
- [ ] Denied events → explicit skips, cursor at range end
- [ ] Stale `expected_version` → `ConflictError` with current version
- [ ] Replayed `idempotency_key` → original result, no second event
- [ ] Two pending purges → both applied; `acked_purge_version` reflects the higher one
- [ ] Resource key never appears in plaintext on the wire or in a log
- [ ] Table counts match this ADR exactly (18 Admin / 6 User)