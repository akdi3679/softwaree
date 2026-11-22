# ADR-002: Admin Is the Sole Source of Truth for Project Data

**Status:** Accepted — amended 2026-11-20
**Date:** 2026-07-26
**Amended:** 2026-11-20 — honest backup custody, `Error::AdminOffline`, one-round-trip write path (no local apply), device generates its own keys, headless Admin option, Cloud-offline operation via certificates
**Deciders:** Architecture team
**See also:** ADR-004 (sequence), ADR-005 (storage), ADR-009 (no offline writes), ADR-010 (auth), ADR-012 (permissions + certificates), ADR-016 (lifecycle), ADR-022 (key custody)

---

## Context

The user requirement:

> *"the admin have all tables and settings and users depend the admin what allow to them to edit they we have on teir computer"*
> *"everything should happen on desktop of the admi mean if useer wanna changenit change on table of admin then if success he will change automatic too ontable of user"*
> *"if admin pc close the all operations cant done"*
> *"And its have the tavles of truuth he manage the users let them what modukes accessible what action can do delete update put post"*

In plain words:
- The Admin's computer is the home of the project's truth.
- Users hold an **authorized projection**, not their own copy of the truth.
- If the Admin is offline, no write can complete — Users are read-only.
- A User's write goes: User → Admin → Admin validates, authorizes, applies → event → User projects it.

## Decision

**The Admin device is the sole authoritative writer for all business data of its project.** Every business mutation flows through the Admin. The Cloud is not in the data path. Users are not in the data path.

1. **One writer.** Only the Admin's command handler issues `INSERT`/`UPDATE`/`DELETE` against business tables, and it does so through the single `apply_event` function (Principle 4). The User app never writes business data; it writes only its own rebuildable projection.

2. **One storage location.** The Admin's `projects/{id}/project.db` (SQLCipher) is canonical. Backups are encrypted archives of that file. **Custody is mode-dependent and stated honestly (ADR-022):** in **assisted** mode the Cloud holds an HSM-wrapped Backup Key and can decrypt only through a controlled, audited, customer-alerted recovery; in **zero-knowledge** mode it holds nothing usable and can never decrypt.

3. **One event log.** All state changes are appended to the Admin's `events` table in the same transaction as the state change, the outbox row and the audit entry. The log is the replication source; the tables are a materialized projection of it.

4. **Users project, never author.** A User sends a `CommandRequest`. The Admin validates, authorizes and applies in one transaction, then replies `CommandResponse` with the applied sequence. **The User does not apply the write locally** — it waits until its projection cursor reaches that sequence via the normal event stream (ADR-012, SYNC-PROTOCOL). There is exactly one update path on the User.

5. **Cloud is a notary, not a database.** It stores control-plane data only: accounts, devices (public keys), project registry, memberships + role IDs, the coarse module-access list, plans, licences, certificates, audit chain snapshots, encrypted backups, discovery endpoint metadata.

6. **The Admin's "down" state is a hard wall.** Unreachable Admin → writes refused with `Error::AdminOffline`, UI state `ADMIN_OFFLINE` or `ADMIN_UNKNOWN`. No offline queue, no pending sync, no optimistic local apply (ADR-009).

7. **The Cloud's "down" state is not a wall.** The Admin verifies Cloud-signed membership certificates locally and enforces its own role tables, so reads and writes continue during a Cloud outage, bounded by the licence grace window (ADR-012, ADR-014).

---

## Consequences

### Positive
- **No conflict resolution.** One writer means no merging, no CRDTs, no vector clocks. Stale writes are rejected by optimistic concurrency, not silently merged.
- **Trivial reasoning.** "What does the system say?" is one query against the Admin.
- **Strong audit.** Every change goes through one code path, logged in one transaction, hash-chained.
- **No permanent divergence.** A stale projection is refreshed; it cannot be permanently wrong.
- **Bounded failure modes.** The Admin is the single point of failure, and we engineer for it: snapshots, backups, recovery, headless hosting.
- **Compliance-friendly.** Regulated customers want one accountable system of record.

### Negative
- **The Admin is critical infrastructure.** Disk death without a backup loses the project. Mitigated by per-plan backup, pre-migration snapshots, the recovery ceremony, and the headless option.
- **Users are limited when the Admin is offline.** Explicit product requirement; the UX is honest rather than fake.
- **Network dependency for every write.** No path to the Admin means read-only.

### Neutral
- **Backup is not a hot replica.** Recovery takes minutes. v2 may add a warm standby.
- **The Admin app is a server.** It runs a local HTTP/WebSocket endpoint on the project's stable virtual address. It can also run **headless on an always-on mini-PC** (same binary, service mode) so a sleeping laptop does not block the team. That is still one Admin, not a second writer. Headless mode uses the opt-in service-unlock wrapper for the Project Master Key (ADR-005, ADR-022) so it can start unattended.

---

## What "source of truth" means in practice

| Data | Owner | Why |
|---|---|---|
| Project business tables (`mod_*`) | Admin | Writes only happen here |
| `events` | Admin | Append-only, transactional with state |
| `outbox` | Admin | Delivery work, same transaction |
| `audit_entries` | Admin | Hash-chained; writes **and sensitive reads** (ADR-016) |
| `tombstones`, `resource_keys`, `blind_indexes`, `erasure_ledger` | Admin | Lifecycle and erasure live with the data |
| `roles`, `role_permissions`, `member_roles` | Admin | The Cloud never holds permission lists |
| `user_projections` (cursors, permission versions, purge acks) | Admin | Must be transactional with `events` |
| User `proj_*` tables | User (locally) | Rebuildable, discardable |
| User `sync_state` cursor | User (locally) | Its position in the log |
| Project identity, plan, licence | Cloud | Registry and entitlements |
| Membership + role IDs + module-access list | Cloud (metadata) / Admin (authority) | Coarse entitlement only |
| Encrypted backup blobs | Cloud (store) / Admin (encrypt) | Assisted: decrypt only via audited recovery. Zero-knowledge: never |
| Backup keys | Assisted: Cloud HSM. Zero-knowledge: customer | ADR-022 |

The full platform table list (18 Admin / 6 User) is in ADR-012. If data exists in two places, one is the source and the other is a projection. There are no "shared" or "synced" tables and no peer-to-peer writes.

---

## Recovery: "what if the Admin disappears?"

```
1. Customer contacts support (or uses their recovery code, in zero-knowledge mode)
2. Cloud-mediated replacement flow (ADR-010) with the recovery ceremony (ADR-022):
   second-factor re-auth, 48-hour wait, out-of-band alerts with a cancel link,
quorum approval for any escrow release (ADR-013 approvals_required;
solo mode = 1 hardware-key approval + 24 h delay + alert)
3. Customer installs the Admin app on a new device
4. THE NEW DEVICE GENERATES ITS OWN TWO KEYPAIRS (Ed25519 + X25519).
   The Cloud never issues or holds a device private key.
5. Cloud marks the new device ACTIVE, revokes the old pubkey, bumps
   revocation_epoch, issues a new Admin authority certificate
6. New device obtains the latest backup and decrypts it via the custody mode:
   assisted → released Backup Key; zero-knowledge → customer recovery code
7. Restore re-applies the erasure_ledger BEFORE the project becomes writable (ADR-016)
8. Module bundles are re-issued bound to the new device (ADR-007)
9. Users verify the new authority certificate and resync
```

This is the only path. The Cloud cannot apply business changes on the customer's behalf and cannot "become" the Admin. The Admin is always a customer-controlled device.

---

## Enforcement

- Lint: no User code may write a business table. The User's schema has `proj_*` projections only.
- Lint: no Cloud code may write per-project business data. The Cloud schema has no business tables.
- Lint: the Admin's command handler is the only writer of business tables, and `apply_event` is the only function that mutates them.
- The `outbox` dispatcher is the only path that pushes events; the User's receive path is the only path that applies them.
- User projection tables are prefixed `proj_` so accidental writes are auditable.
- The User's command-sending function returns **`Error::AdminOffline`** when the Admin is unreachable. (This replaces the older name `AdminUnavailable` everywhere.)
- Lint: no project-operation handler may require a Cloud session token.

### Tests
- [ ] Admin offline → writes refused with `Error::AdminOffline`, reads still work
- [ ] Cloud offline 60 minutes → reads and writes continue
- [ ] User never writes business tables (schema + lint assertion)
- [ ] Write committed on Admin, connection dropped → UI shows "Saved on Admin", data arrives on reconnect
- [ ] Stale `expected_version` → `ConflictError`, no silent overwrite
- [ ] Replacement device generates its own keys; Cloud holds only public keys
- [ ] Restore re-applies the erasure ledger before write access returns
- [ ] Headless Admin on a mini-PC serves Users with no desktop session