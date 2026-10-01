# ADR-004: Global Event Sequence + Per-User Projection Cursor

**Status:** Accepted
**Date:** 2026-07-26
**Deciders:** Architecture team

---

## Context

The Admin must deliver data changes to all interested Users. When a User connects, it must be able to ask for "everything that changed since I last heard from you." We need to decide the sequencing model.

## Decision

**A single global event sequence on the Admin**, monotonically increasing, paired with **a per-User projection cursor** that tracks the last event each User has applied to its local projection.

```
Admin's event log:
  1001: PatientCreated(P1)
  1002: PatientUpdated(P1, phone)
  1003: AppointmentCreated(A1)
  1004: PatientUpdated(P2, name)
  1005: UserRoleGranted(U3, patient.read)

UserA's cursor:  1000   (has applied 1001, 1002, 1005 — note: gaps allowed)
UserB's cursor:  1002
UserC's cursor:  1000
```

When UserA reconnects, it asks "give me events 1003 → 1005 that I'm allowed to see." The Admin filters by current authorization and sends. UserA applies them in order, advances its cursor to 1005.

## Consequences

### Positive

- **Simple to reason about.** The Admin has one log, one sequence. No per-user streams, no fanout matrices.
- **Authorization re-checked at delivery.** If UserA's `patient.read` for P2 was revoked between event creation (1004) and delivery, UserA does not receive event 1004. The cursor advances only for events actually delivered.
- **Reordering-safe.** Events are applied in sequence order; idempotency keys prevent double-application.
- **Gaps are explicit.** If a User was offline during events 1003–1004, they explicitly receive them on reconnect. No silent loss.
- **Debuggable.** "What did the system do?" is a SQL query on the event log with a known sequence.

### Negative

- **Users may have very different cursors.** The Admin must keep track of N cursors. Acceptable — N is at most a few hundred per Admin in practice.
- **Authorization re-check at delivery is more work than at creation.** Worth it. Otherwise we leak data on permission revocation.

### Neutral

- The sequence is per-Admin, not per-Database-file. Each project has its own Admin with its own sequence. They never merge.

## Cursor Semantics

A User's cursor advances **only for events actually applied to its local projection**. If event 1004 is denied (permission revoked), the User's cursor advances past it to 1005 — but 1004 is never in the User's history. This is important for:

- **Replay safety.** If the User later requests "give me events after 1000," they don't re-receive the denied event.
- **Audit clarity.** The User's projection log shows what it actually saw, not what it was offered.

Implementation: the User's `last_applied_sequence` is the highest sequence for which it has applied (or explicitly skipped with `denied`) an event.

## Conflict Resolution

This ADR is about sequencing, not conflict resolution per se. But to be complete:

- **Aggregate-level conflicts** (two users edit the same record) are resolved by **optimistic concurrency** (version field). The Admin's write wins. Last-write-wins is the default; the User who loses the conflict sees a clear "your change was overridden" notification.
- **Field-level conflicts** (User A edits field X, User B edits field Y simultaneously) are merged automatically — both changes apply.
- **No offline write conflicts in v1.** Per ADR-009.

## Snapshot Strategy

If a User's cursor is more than N (configurable, default 5,000) events behind, or more than X days (default 7) behind, the Admin sends a **full snapshot of the User's authorized projection** at the current sequence, then incremental events from there.

The snapshot is itself an event (sequence N+1, type `ProjectionSnapshotSent`). The User applies the snapshot atomically (in a transaction), then continues with the delta.

This is the "Linear pattern" — they ship the whole workspace on first connect, then deltas.

## Alternatives Considered

### Per-user sequences

**Pros:** natural authorization boundary; each user gets only the events they should see.
**Cons:** complex fanout (N streams instead of 1); harder to add a new user; harder to backfill; cursor tracking explodes.
**Rejected because:** the per-user cursor + authorization re-check at delivery gives us the same security without the operational cost.

### Per-aggregate sequences

**Pros:** localized conflict resolution.
**Cons:** delivery order becomes complex; users care about all their data, not per-aggregate data.
**Rejected because:** it doesn't match the user's mental model ("show me everything that changed for my work today").

### Lamport timestamps / vector clocks

**Pros:** distributed-safe.
**Cons:** we have one writer per project (the Admin), so distributed sequencing is overkill.
**Rejected because:** we don't have the problem Lamport timestamps solve.

### CRDTs

**Pros:** automatic merge, no conflicts.
**Cons:** wrong tool for the data we have (regulated, financial, medical — not collaborative text).
**Rejected because:** see ADR-002.

## Enforcement

- The `events` table has `sequence BIGINT PRIMARY KEY` (or composite with `project_id`).
- A database trigger (or a service-level invariant) prevents gaps in the sequence. Every insert gets the next number atomically.
- The `user_projections` table has `last_applied_sequence` per user per project.
- Delivery code re-checks authorization against current `permissions` table, not against a snapshot at event creation time.
- Snapshot triggers (5,000 events or 7 days) are configurable per project, default values in `platform-cloud/`.
