# ADR-008: Snapshot-on-Gap Recovery for Out-of-Sync Users

**Status:** Accepted — amended 2026-11-20
**Date:** 2026-07-26
**Amended:** 2026-11-20 — snapshot is a transport frame (not an event), cache keyed by permission version and encrypted, honest bandwidth claim, chunking, grant backfill, three distinct snapshot scopes, wrapped resource keys
**Deciders:** Architecture team
**See also:** ADR-004 (sequence + cursor), ADR-005 (file layout), ADR-012 (permissions + key delivery), ADR-022 (keys), SYNC-PROTOCOL

---

## Context

A User may be offline for days or weeks while the Admin keeps generating events. On reconnect it must catch up. Replaying every event does not scale:

- 30 days offline at one event per second ≈ 2.5 million events
- Bandwidth wasted, CPU wasted, minutes of waiting

The right shape for our system: if a User is too far behind, ship a full snapshot of **its authorised projection**, then deltas from there.

---

## Decision

**The Admin sends a full projection snapshot when a User's cursor is further behind than a configurable threshold.**

| Threshold | Default | Configurable per project |
|---|---|---|
| Event-count gap | 5,000 events | yes |
| Time gap | 7 days | yes |
| Force snapshot (Admin manual) | — | yes (button) |
| Permission grant backfill | always | no (ADR-012) |
| Module-update catch-up | always | no (ADR-011) |

When a threshold is crossed on reconnect, the Admin:

```
1. Pauses delta delivery to that User
2. Computes the User's authorised projection at the current sequence S
3. Serialises it as one snapshot payload, stamped with S and the User's permission_version
4. Sends it as a SnapshotPayload TRANSPORT FRAME (chunked, see below)
5. Resumes delta delivery from S + 1
```

**A snapshot is not an event.** It is per-User, it contains no new fact, and it must never enter the Admin's global `events` log. It is a transport frame tied to the sequence at which it was computed. There is no `ProjectionSnapshotSent` event type.

The User applies it atomically in one transaction, sets its cursor to `S`, then resumes normal delta processing.

### The three snapshot scopes

A `SnapshotPayload` carries a `scope` with exactly three values. They are different operations and are never conflated:

| Scope | Meaning | Deletes? | Used for |
|---|---|---|---|
| `"full"` | Wipe the member's projection and replace it | yes — everything | Gap recovery, first sync |
| `"partial"` | Add the listed resources, never delete | no | **Grant backfill** (a member newly authorised for resources) |
| `"module_refresh"` | Replace exactly one module's rows | yes — that module only | **Module-update catch-up** (ADR-011) |

`"partial"` is never used for replacement, and `"module_refresh"` is never used for a grant. Confusing them would either leak stale rows or delete data that should survive.

### Chunking

The maximum frame size is 16 MB (SYNC-PROTOCOL). A larger snapshot is split into ordered `SnapshotPayload` chunks carrying `snapshot_id`, `chunk_index`, `chunk_count`, and the same `sequence`. The User buffers chunks, verifies the Admin's signature over the complete payload, and only then applies. An incomplete or failed transfer leaves the User at its old cursor.

### Wrapped resource keys

Sensitive resources are encrypted per-resource (ADR-016). A snapshot that contains sensitive rows carries a `keys` section: for each such resource, the resource key **wrapped to the recipient member's X25519 key** (ADR-012 §4). The Admin never sends a resource key in plaintext.

---

## Consequences

### Positive
- **Bounded recovery time.** Recovery is O(snapshot size), not O(events since last sync).
- **Consistent state guaranteed.** A snapshot is a point-in-time view at sequence `S`. After applying it, the User's projection equals the Admin's authorised view at `S`.
- **Predictable behaviour.** First reconnect is always "snapshot if too far behind, else deltas". No special cases.
- **Correct under permission changes.** The snapshot is computed with **current** permissions and stamped with the current `permission_version`.
- **Correct under module updates.** `module_refresh` replaces one module's rows without disturbing the rest.

### Negative
- **Snapshots are not always smaller than the deltas they replace.** A 10,000-patient projection may be ~50 MB; 5,000 small events may be far less — or far more. We do **not** claim a size win. We claim a **bounded, predictable** recovery cost, and we trade bandwidth for it.
- **Snapshot computation is CPU work on the Admin.** 100 Users reconnecting after a long weekend means 100 projection computations. Mitigated by:
  - Caching the most recent snapshot per User (TTL 1 hour, keyed by permission version, invalidated on any permission change)
  - Background pre-computation for known-disconnected Users (v2)
  - A cheap denormalised projection table on the Admin
- **Storage.** The Admin keeps cache files on disk. They are encrypted and rebuildable, and are excluded from backups.

### Neutral
- The snapshot is the User's **authorised** projection, never the whole project.
- `"partial"` is also the mechanism for **grant backfill**: when a member gains access to a resource they never received, the Admin sends a partial snapshot of exactly those resources at the current sequence (ADR-012). Same frame type, same atomic apply, `scope: "partial"`.

---

## Snapshot format

```json
{
  "snapshot_id": "snap_proj_a1b2c3_user_u9_2026-11-20T10:00:00Z",
  "project_id": "proj_a1b2c3",
  "user_id": "user_u9",
  "sequence": 50342,
  "permission_version": 12,
  "scope": "full",
  "granted_resources": null,
  "refresh_module": null,
  "generated_at": "2026-11-20T10:00:00Z",
  "schema_version": 4,
  "projection_format_version": 2,
  "chunk_index": 0,
  "chunk_count": 3,
  "tables": {
    "proj_patients": [
      { "id": "p1", "name": "...", "phone": "..." }
    ],
    "proj_appointments": [],
    "proj_members": []
  },
  "keys": [
    { "resource_id": "p1", "wrapped_key": "base64..." }
  ],
  "signature": "base64... (Admin device signature over JCS of the payload minus signature)"
}
```

For `scope: "partial"`, `tables` contains only the newly authorised resources, and `granted_resources` lists them so the User knows this is an additive backfill rather than a full wipe.
For `scope: "module_refresh"`, `refresh_module` names the module, and `tables` contains only that module's rows.

### Applying a snapshot (User side)

```
1. Verify the Admin device signature over the complete payload
2. Verify schema_version and projection_format_version match this app
3. Verify permission_version >= the last one this User has seen
4. BEGIN
5.   scope = full           → wipe the projection tables
     scope = partial        → delete only the listed granted_resources (idempotent re-apply)
     scope = module_refresh → delete that module's rows only
6.   Insert the snapshot rows
7.   Unwrap the keys and store them in the projection key store
8.   Set cursor = payload.sequence, permission_version = payload.permission_version
9. COMMIT
10. Resume sync from sequence + 1
```

Atomic. Any failure leaves the User at its old cursor; it asks again on reconnect. Re-applying the same `snapshot_id` is a no-op.

---

## Snapshot caching on the Admin

Two different things live under `snapshots/`, and they are never mixed (ADR-005):

```
projects/{id}/snapshots/
├── recovery/                              ← local pre-migration / recovery snapshots
│   └── 2026-11-20T02:00:00Z.pre-migration.snap
└── projection-cache/                      ← per-User sync caches, ENCRYPTED at rest
    ├── user_u9/
    │   ├── pv12_2026-11-20T00:00:00Z.snap
    │   └── pv12_2026-11-20T09:00:00Z.snap
    └── user_u10/
        └── ...
```

- `recovery/` is included in local backup routines. `projection-cache/` is **not** backed up — it is rebuildable.
- Cache files are encrypted with the **Projection Cache Key** (a random per-project key held in the OS keychain, distinct from the database key — ADR-022). A cache file on a stolen disk is ciphertext.
- `pv<N>` in the filename is the permission version. Cache entries for older permission versions are deleted immediately when the version bumps.

### Cache lookup on reconnect

```
1. Is there a cached snapshot for (user_id, CURRENT permission_version) younger than 1 hour?
2. Yes → send it; the User's cursor advances to the snapshot's sequence
3. No  → compute a fresh snapshot, cache it under (user_id, permission_version), send it
```

**Any permission change for a member bumps their `permission_version` and deletes every cached snapshot for them.** A cached snapshot must never be served to a just-revoked user. This is the difference between a cache and a data leak.

---

## When to pre-compute snapshots

For Users known to be disconnected (no session keepalive for more than a day), the Admin may pre-compute snapshots during off-peak hours to avoid the "Monday morning, 100 Users at once" stampede. Pre-computed snapshots carry the same permission version stamp and are invalidated the same way.

This is a **v2 optimisation**. In v1 the first reconnecting User waits a few extra seconds.

---

## Alternatives Considered

### Always replay events
**Pros:** simplest. **Cons:** a 30-day disconnect means minutes of replay and heavy CPU on both sides. **Rejected:** Users will be offline for weeks.

### Incremental snapshots (diff against the previous snapshot)
**Pros:** smaller, faster. **Cons:** delta tracking, complex error recovery, harder to test. **Deferred to v2.** Optimise when measured.

### Per-aggregate snapshots
**Pros:** reusable across Users. **Cons:** per-user authorisation still forces per-user assembly. **Rejected:** authorisation is the expensive part. Per-table caching may be added in v2.

### Snapshot as an event in the global log
**Pros:** one delivery mechanism. **Cons:** a per-User artifact would pollute the single global sequence, inflate the log, and appear in other Users' ranges. **Rejected:** it is a transport frame.

### One "partial" scope for both grant and module update
**Pros:** fewer cases. **Cons:** a grant is additive; a module update is a scoped replacement. Using one flag for both either leaks stale rows or deletes surviving data. **Rejected:** three explicit scopes.

---

## Enforcement

- `decide_delivery_mode(user, gap)` is the only path that chooses delta vs snapshot. It returns `delta`, `snapshot_full`, `snapshot_partial`, or `snapshot_module_refresh`.
- Thresholds are project settings persisted in the project config, with defaults applied at creation.
- Every snapshot is signed by the Admin device. A bad signature means the User refuses it and keeps its old cursor.
- Snapshot caches are keyed by `(user_id, permission_version)` and encrypted at rest. A permission change invalidates them synchronously, before the permission change is acknowledged.
- No code path may write a snapshot into `events`.
- `projection_format_version` and `schema_version` are checked before any apply.
- Lint: no resource key is transmitted in plaintext; every key in a snapshot is wrapped to the recipient's X25519 key.

### Tests
- [ ] Gap of 5,001 events → snapshot; 4,999 → deltas
- [ ] 8-day gap → snapshot
- [ ] Snapshot never appears in `events`
- [ ] Snapshot larger than 16 MB → chunked, reassembled, applied atomically
- [ ] Interrupted chunk transfer → old cursor retained, retried on reconnect
- [ ] Permission revoked → cache entries deleted, next snapshot excludes the resource
- [ ] Permission granted → partial backfill delivers previously unseen rows and keys
- [ ] Module update → module_refresh replaces only that module's rows
- [ ] partial never deletes; module_refresh never touches other modules
- [ ] Re-applying the same `snapshot_id` → no-op
- [ ] Cache file on disk is ciphertext without the keychain key
- [ ] Tampered snapshot → signature check fails, cursor unchanged
- [ ] Resource keys in a snapshot are wrapped, never plaintext