# ADR-008: Snapshot-on-Gap Recovery for Out-of-Sync Users

**Status:** Accepted
**Date:** 2026-07-26
**Deciders:** Architecture team

---

## Context

A User may be offline for days, weeks, or longer. During that time, the Admin continues to generate events. When the User reconnects, it must catch up. The naive approach (replay every event) doesn't scale:

- A User offline for 30 days at one event per second = 2.5 million events
- Network bandwidth wasted
- Replay CPU wasted
- Replay wall-clock time = minutes of waiting for the User

Linear's approach (and the right one for our shape) is: if a User is too far behind, ship a full snapshot of their authorized projection, then deltas from there.

## Decision

**The Admin sends a full projection snapshot when a User's cursor is more than a configurable threshold behind.** The thresholds are:

| Threshold | Default | Configurable per project? |
|---|---|---|
| Event-count gap | 5,000 events | yes |
| Time gap | 7 days | yes |
| Force snapshot (admin manual) | — | yes (admin clicks button) |

When ANY threshold is crossed on a User's reconnect, the Admin:

```
1. Stops sending deltas to that User
2. Computes the User's authorized projection at the current sequence
3. Serializes the projection as a single snapshot payload
4. Sends the snapshot + the current sequence as a SnapshotSent event
5. Resumes sending deltas from the snapshot's sequence + 1
```

The User applies the snapshot atomically (in a single transaction), then resumes normal delta processing.

## Consequences

### Positive

- **Bounded recovery time.** Recovery is O(snapshot_size) not O(events_since_last_sync).
- **Bounded bandwidth.** Snapshot is bigger than one event but smaller than 5,000 events.
- **Consistent state guaranteed.** A snapshot is a point-in-time view. The User's projection after applying it is identical to the Admin's view at that sequence.
- **Predictable behavior.** The User's first reconnect is always "give me the snapshot if I'm too far behind, else give me deltas." No special cases.
- **Aligned with Linear's proven approach.** Same shape, slightly different mechanism.

### Negative

- **Snapshots are larger than deltas.** A snapshot of a 10,000-patient clinic projection is maybe 50MB. A delta of 100 events is maybe 50KB. We trade bandwidth for simplicity.
- **Snapshot computation is CPU work on the Admin.** For 100 users reconnecting simultaneously after a long weekend, this is 100 × projection computation. We mitigate by:
  - Caching the most recent snapshot per user (TTL = 1 hour)
  - Incremental snapshot computation (diff against the previous snapshot, fall back to full if cache miss)
  - Background snapshot pre-computation for known disconnected users (e.g., nightly)
- **Storage.** The Admin needs to keep the projection materializable. We mitigate by keeping a denormalized projection table that's cheap to read.

### Neutral

- The snapshot is the User's **authorized** projection, not the full project. If the user's permissions changed during the offline period, the snapshot reflects the new permissions, not the old.

## Snapshot Format

```json
{
  "snapshot_id": "snap_proj_a1b2c3_user_u9_2026-07-26T10:00:00Z",
  "project_id": "proj_a1b2c3",
  "user_id": "user_u9",
  "sequence": 50342,
  "generated_at": "2026-07-26T10:00:00Z",
  "tables": {
    "patients_projection": [
      { "id": "p1", "name": "...", "phone": "..." },
      { "id": "p2", "name": "...", "phone": "..." }
    ],
    "appointments_projection": [...],
    "users_in_project": [...]
  },
  "schema_version": 4,
  "projection_format_version": 2
}
```

The User's app:
1. Validates the snapshot (signature from Admin, schema_version match, projection_format_version match)
2. Begins a transaction
3. Wipes its current projection tables
4. Inserts all the snapshot data
5. Updates its cursor to the snapshot's sequence
6. Commits
7. Resumes normal sync from sequence + 1

This is atomic. If any step fails, the User stays at its old cursor and asks again on reconnect.

## Snapshot Caching on the Admin

```
projects/{id}/snapshots/
├── user_u9/
│   ├── 2026-07-25T00:00:00Z.snap   ← cached, expires after 1 hour
│   └── 2026-07-26T00:00:00Z.snap
├── user_u10/
│   └── ...
```

When a User reconnects:
1. Check cache: is there a snapshot for this user from the last hour?
2. If yes: send cached snapshot, advance user's cursor to the snapshot's sequence
3. If no: compute fresh snapshot, cache it, send

## When to Pre-Compute Snapshots

For known-disconnected Users (e.g., User's machine has been offline > 1 day based on last heartbeat), the Admin can pre-compute snapshots during off-peak hours. This avoids the "Monday morning 100 users reconnect at once" stampede.

This is a v2 optimization. In v1, the first reconnecting user just waits a few extra seconds for the snapshot.

## Alternatives Considered

### Always replay events (no snapshots)

**Pros:** simplest.
**Cons:** does not scale. A 30-day disconnect = minutes of replay, megabytes of bandwidth, CPU on both sides.
**Rejected because:** the user wants 1k → 1M users. We will have users offline for weeks. We need this.

### Incremental snapshots (diff against last snapshot)

**Pros:** smaller than full snapshot, faster to apply.
**Cons:** requires tracking snapshot deltas; complex error recovery; harder to test.
**Considered for v2.** In v1, full snapshot is good enough. Optimize when measured.

### Per-aggregate snapshots (one per entity type)

**Pros:** can be cached and reused across users.
**Cons:** more complex assembly; per-user authorization still requires per-user snapshots at the row level.
**Rejected because:** the per-user authorization step is the expensive part. We can add per-table caching in v2.

## Enforcement

- The Admin's sync engine has a `decide_delivery_mode(user, gap)` function that returns either `delta` or `snapshot`. The function is the only path to delivering data to a User.
- The threshold values (5,000 events, 7 days) are project settings, persisted in the project config. Default values applied on project creation.
- Snapshots are signed by the Admin device. The User verifies the signature before applying. A bad signature = refuse the snapshot, stay at old cursor.
- Snapshot format is versioned. The `projection_format_version` field allows future format changes.
