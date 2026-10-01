# ADR-002: Admin Is the Sole Source of Truth for Project Data

**Status:** Accepted
**Date:** 2026-07-26
**Deciders:** Architecture team

---

## Context

The user requirement:

> *"the admin have all tables and settings and users depend the admin what allow to them to edit they we have on teir computer"*

> *"everything should happen on desktop of the admi mean if useer wanna changenit change on table of admin then if success he will change automatic too ontable of user"*

> *"if admin pc close the all operations cant done"*

> *"And its have the tavles of truuth he manage the users let them what modukes accessible what action can do delete update put post"*

In plain words:
- The Admin's computer is the home of the project's truth.
- Users do not have their own copy of the truth. They have an *authorized projection* of it.
- If the Admin is offline, no write can complete — Users see the system as read-only.
- A User's write goes: User → Admin → Admin applies (validates, authorizes) → event → User applies locally.

## Decision

**The Admin device is the sole authoritative writer for all business data of its project.** Every business mutation flows through the Admin. The Cloud is *not* in the data path. Users are *not* in the data path.

Concretely:

1. **One writer.** Only the Admin's process issues `INSERT`/`UPDATE`/`DELETE` against the project's business tables. The User app *never* writes business data. It only writes to its own local projection (which is rebuildable from the event log).

2. **One storage location.** The Admin's local SQLite file (`projects/{id}/project.db`) is the canonical store. Backups are snapshots of this file (encrypted, with key escrow). The Cloud stores backup blobs but cannot decrypt them without an authorized recovery flow.

3. **One source of the event log.** All state changes are written to the Admin's append-only `events` table in the same transaction as the data change. The event log is the source of truth for replication; the tables are a materialized projection of it.

4. **Users apply, never author.** A User who wants to change something sends a `CommandRequest` over the local mesh. The Admin applies it (after authorization, validation, and transaction). The Admin then emits events. The User applies those events to its own projection. The User's projection is *disposable* — if it's lost or wrong, the Admin can ship a fresh snapshot.

5. **Cloud is a notary, not a database.** The Cloud does not store, relay, or apply business data. It only stores control-plane data (accounts, devices, project metadata, audit hash-chain snapshots, encrypted backup blobs, module signatures, discovery IP metadata).

6. **The Admin's "down" state is a hard wall.** When the Admin is unreachable, User writes are rejected with a clear error. There is no offline queue, no "pending sync," no optimistic local apply. (See ADR-009.)

## Consequences

### Positive

- **No conflict resolution.** One writer means we never have to merge. No CRDTs, no vector clocks, no "your change was overridden" UX.
- **Trivial reasoning.** "What does the system say?" is answered by one query against the Admin's database.
- **Strong audit.** Every change goes through one code path, all logged in one transaction.
- **No data divergence.** A User cannot end up with a state that disagrees with the Admin. If the projection is stale, it will be refreshed; it cannot be permanently wrong.
- **Bounded failure modes.** The Admin can be the only point of failure, and we engineer for that (snapshots, backups, recovery). The Users are passive.
- **Compliance-friendly.** Regulated industries (medical, food) want a single accountable system of record. The Admin is exactly that.

### Negative

- **The Admin is critical infrastructure.** If the Admin's disk dies and there is no backup, the project is lost. We mitigate via: per-plan automatic backup, encrypted snapshot-on-write, key escrow in the Cloud, Admin device replacement flow.
- **Users feel "useless" when the Admin is offline.** This is the explicit product requirement (no offline writes in v1). We make the UX honest about it (banner, disabled controls, clear error) rather than fake it.
- **Network dependency for any write.** A User who wants to do anything must reach the Admin. If Admin and User are not on the same network and there is no relay, the User is fully read-only.

### Neutral

- **Backup is not a hot replica.** The backup is a snapshot. Recovery takes minutes, not milliseconds. v1 accepts this. v2 may add a hot-warm standby model.
- **The Admin app is a server.** It runs a local HTTP/WebSocket endpoint for the Users to reach (on the stable virtual IP). It is not just a desktop UI.

## What "Source of Truth" Means in Practice

| Data | Owner | Why |
|---|---|---|
| Project business tables | Admin | Writes only happen here. |
| `events` log | Admin | Append-only, transactional with table writes. |
| `outbox` | Admin | Pending events for delivery to Users. |
| `audit_entries` | Admin | Append-only, hash-chained, one row per state change. |
| Per-User projection tables (on the User) | User (locally) | Rebuildable from `events`; discardable. |
| User's `last_applied_sequence` | User (locally) | Where this User is in the event log. |
| Project identity (in Cloud) | Cloud | Account, project, device, plan, license. |
| Encrypted backup blobs | Cloud (store) / Admin (encrypt, send) | Cloud cannot decrypt without recovery flow. |
| Soft-delete tombstones | Admin (data) + Cloud (metadata, via corbeille audit) | Per goal: "we will hold its things that make the deleted soft or hard we will hold them" |

If data is in two places, one is the source and the other is a projection. There are no "shared" tables, no "synced" tables, no peer-to-peer writes.

## Recovery and the "What If the Admin Disappears?" Question

If the Admin's device is destroyed, lost, or stolen:

1. Customer contacts support.
2. Cloud-mediated Admin replacement flow (see ADR-010 §Admin Device Replacement).
3. Customer installs the Admin app on a new device.
4. New device authenticates with account credentials + recovery proof.
5. Cloud issues a fresh device keypair, marks the new device as the active Admin.
6. New device downloads the latest backup blob, decrypts it with the escrow key, restores the project locally.
7. New device is now the source of truth; all Users reconnect and resync.

This is the only path. The Cloud cannot apply business changes on the customer's behalf. The Cloud cannot "become" the Admin. The Admin is always a customer-controlled device.

## Enforcement

- A linter rule: no User app code can execute a write against any business table. The User app's SQLite database has no business tables — only projection tables.
- A linter rule: no Cloud code can execute a write against any per-project business data. The Cloud's schema has no business tables — only control-plane tables.
- A linter rule: the Admin's command handler is the only path that can write to business tables. Direct SQL writes from anywhere else are forbidden.
- The Admin's `outbox` dispatcher is the only path that can push events to Users. The User's receive path is the only path that can apply them to the projection.
- The User's local projection tables are tagged in the schema (e.g., prefix `proj_`) to make accidental writes auditable.
- The "no offline writes in v1" rule is enforced by the User app's command-sending function returning `Error::AdminUnavailable` when the Admin is unreachable.

## See also

- ADR-005: One SQLite File Per Project
- ADR-009: No Offline Writes in v1
- ADR-010: Roll-Our-Own Auth
- ADR-018, ADR-019, ADR-020: the mesh (where Admin ↔ User sync actually happens)
- PRINCIPLES §2: One Project = One Admin
- PRINCIPLES §3: Admin Offline = No Authoritative Writes
