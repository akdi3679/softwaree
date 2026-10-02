# ADR-008: Snapshot-On-Gap Recovery

**Status:** Accepted
**Date:** 2026-02-10
**Supersedes:** none
**Superseded by:** none

---

## Context

A User can fall arbitrarily far behind the Admin's event stream (device
was off for weeks, disk was restored from an old backup, first sync after
pairing). Replaying tens of thousands of individual events over a slow
link is unacceptable.

Options:

1. Always replay every event from the cursor. Simple, slow.
2. Periodic snapshots + replay from the last snapshot. Fast but loses
   per-event history for skipped ranges.
3. Adaptive: replay when close, snapshot when far.

## Decision

Adaptive strategy with two thresholds:

- If the missing sequence count is **greater than 5,000 events** OR the
  oldest unapplied event is **older than 7 days**, send a snapshot.
- Otherwise, send incremental events.

A snapshot is a compressed, sequence-ordered batch of events covering
`1..through_sequence`. It replaces the User's local projection entirely
(non-incremental) or updates it (incremental). Both modes are supported;
the wire format carries a boolean `incremental`.

Snapshot delivery uses the same CBOR frame channel (SnapShotPayload
frame type) and is followed by normal incremental sync from
`through_sequence + 1`.

## Consequences

Positive:

- Users catch up in seconds even after long absences.
- Snapshot recovery also serves first-time pairing (empty projection).
- The threshold is a single tunable constant.

Negative:

- A snapshot transfers more bytes than the tail of an event stream. Only
  triggered when the alternative is worse.
- The User must tolerate a full DELETE + replay. The applier wraps the
  apply in a transaction; a partial snapshot never leaves the DB.

## Alternatives considered

**Always replay events.** Rejected: an 800K-event backlog would take
hours over LAN and days over WAN.

**Periodic snapshots only.** Rejected: loses per-event fidelity on
normal sync. Incremental events are needed to drive UI updates live.

**Full DB copy instead of event snapshot.** Rejected: couples the User
schema to the Admin schema. Snapshots use the same event envelope as
incremental sync, preserving the projection contract.

## References

- apps/user/src-tauri/src/projection/snapshot.rs
- apps/user/src-tauri/src/sync/snapshot_apply.rs
- docs/architecture/SYNC-PROTOCOL.md