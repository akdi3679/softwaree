# ADR-004: Global Event Sequence + Per-User Projection Cursor

**Status:** Accepted — amended 2026-11-20
**Date:** 2026-07-26
**Amended:** 2026-11-20 — sequence is per project, cursor example corrected, range batches with explicit skip reasons, optimistic concurrency only, snapshot is a transport frame, permission-versioned filtering
**Deciders:** Architecture team
**See also:** ADR-002 (authority), ADR-005 (one file per project), ADR-008 (snapshots), ADR-012 (permissions + delivery), SYNC-PROTOCOL

---

## Context

The Admin must deliver changes to all interested Users. On reconnect a User asks for "everything that changed since I last heard from you." We need a sequencing model that survives authorization changes and long offline periods.

## Decision

**One global event sequence per project**, monotonically increasing, paired with **a per-member projection cursor**.

The sequence lives in `events` inside that project's `project.db`. A Plan 4 Admin hosting five projects has five independent sequences. They never merge and never share a counter.

```
Admin's event log (project proj_a1b2c3):
  1001: PatientCreated(P1)
  1002: PatientUpdated(P1, phone)
  1003: AppointmentCreated(A1)          ← UserA not authorized
  1004: PatientUpdated(P2, name)        ← UserA not authorized
  1005: RoleGranted(U3, patient.read)

UserA's cursor: 1005   (applied 1001, 1002, 1005; 1003–1004 skipped as denied)
UserB's cursor: 1002
UserC's cursor: 1000
```

When UserC reconnects it asks: *"give me everything after 1000 that I may see."* The Admin filters by **current** authorization and sends one batch covering the range **1001 → 1005**, declaring "this is everything you may see in this range." UserC applies the allowed events in order and advances its cursor to the batch's end sequence, recording denied events as explicitly skipped.

---

## Range batches and cursor semantics

Every `EventBatch` carries `range_start` and `range_end`.

- The cursor advances to `range_end` after the batch is applied.
- Events inside the range that were not delivered are recorded as skips with a reason:
  - `denied` — not authorized under current permissions
  - `module_incompatible` — the member's module version cannot apply this event (ADR-011)
- **A gap inside a delivered range means "not authorized" or "module update needed", never "lost."**
- The cursor never advances past a range it has not received.
- Events missed while offline are delivered on reconnect, or replaced by a snapshot (ADR-008).

This gives three properties:
- **Replay safety.** Re-requesting "after 1005" never re-delivers a denied event.
- **Audit clarity.** The User's projection records what it actually saw.
- **No silent loss.** Every sequence number in a covered range is accounted for.

`permission_version` accompanies every batch. If it is newer than the User's, the User knows a permission change occurred and expects a backfill or purge (ADR-012).

---

## Consequences

### Positive
- **Simple to reason about.** One log, one sequence per project. No per-user streams, no fanout matrix.
- **Authorization re-checked at delivery.** A permission revoked between creation and delivery is honoured.
- **Ordering-safe.** Events apply in sequence order; idempotency keys prevent double application.
- **Debuggable.** "What happened?" is a SQL query with a known sequence.

### Negative
- **Members have very different cursors.** The Admin tracks N cursors in `user_projections`. N is bounded by the plan's tested ceiling (200 concurrent, ADR-021).
- **Delivery-time authorization costs more than creation-time.** Worth it — otherwise revocation leaks data.
- **Skip bookkeeping.** The User stores skip reasons for covered ranges. Small rows, bounded by batch size.

### Neutral
- The sequence is **per project**, matching "one project = one Admin = one file".
- Snapshot delivery does not consume a sequence number (ADR-008).

---

## Conflict resolution

- **All conflicts use optimistic concurrency.** Every command carries `expected_version` for the aggregate it mutates. If the Admin's current version differs, the command is rejected with `ConflictError` including the current version. The User re-reads and retries deliberately.
- **No last-write-wins. No automatic field merging.** For regulated medical and lab data, a silent overwrite or an auto-merge is unacceptable.
- The Admin serializes all writes, so "simultaneous" edits are ordered; the second writer always sees a version mismatch.
- **No offline write conflicts in v1** (ADR-009).

---

## Snapshot strategy

If a member's cursor is more than **5,000 events** or **7 days** behind (both configurable per project), the Admin sends a full snapshot of that member's authorized projection at sequence `S`, then deltas from `S + 1`.

**The snapshot is a transport frame, not an event.** It is per-member, contains no new fact, and must never enter the global log. There is no `ProjectionSnapshotSent` event type. The User applies it atomically, sets its cursor to `S`, and resumes.

Snapshots are also used for **grant backfill** (`scope: "partial"`) when a member gains access to resources they never received. Full mechanics, caching and chunking in ADR-008.

---

## Alternatives Considered

**Per-user sequences.** Natural authorization boundary, but N streams, complex fanout, painful backfill. Rejected: per-member cursor + delivery-time filtering gives the same security at lower cost.

**Per-aggregate sequences.** Localized conflicts, but delivery ordering becomes complex and users think in terms of "everything that changed for my work today". Rejected.

**Lamport timestamps / vector clocks.** Distributed-safe, but we have one writer per project. Rejected: we do not have the problem they solve.

**CRDTs.** Automatic merge, wrong tool for regulated records, contradicts Admin-as-authority. Rejected (ADR-002).

**Last-write-wins.** Simple, and silently destroys clinical data. Rejected.

**Snapshot as an event.** One delivery mechanism, but a per-member artifact would pollute the global sequence and appear in other members' ranges. Rejected.

---

## Enforcement

- `events.sequence` is `INTEGER PRIMARY KEY` within the project file. Allocation is atomic inside the write transaction; a service-level invariant plus a trigger prevents gaps.
- `user_projections` holds `last_applied_sequence`, `permission_version` and `module_versions` per member.
- Delivery re-checks authorization against the live `roles` / `role_permissions` / `member_roles` tables — never a snapshot taken at event creation.
- Every batch declares its range; every non-delivered sequence in that range has a recorded reason.
- Snapshot thresholds are **project settings persisted in the project config**, with defaults applied at creation. They are not Cloud-side constants.
- Lint: no code path may insert a snapshot into `events`.
- Lint: no delivery path may advance a cursor beyond a received `range_end`.

### Tests
- [ ] Two projects on one Admin → independent sequences, no interference
- [ ] Denied events → explicit `denied` skips, cursor at `range_end`
- [ ] Incompatible module → `module_incompatible` skips, update prompt, partial backfill after update
- [ ] Re-request "after cursor" → no re-delivery of skipped events
- [ ] Gap of 5,001 events → snapshot; 4,999 → deltas
- [ ] Snapshot never appears in `events`
- [ ] Stale `expected_version` → `ConflictError` with current version
- [ ] Replayed `idempotency_key` → original result, no second event
- [ ] Concurrent edits to different fields of one record → second writer conflicts, no auto-merge
- [ ] Permission revoked mid-stream → next batch excludes the resource, `permission_version` bumps