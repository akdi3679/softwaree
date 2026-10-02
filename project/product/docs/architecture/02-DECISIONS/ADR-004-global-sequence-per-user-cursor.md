# ADR-004: Global Sequence Per Project, Per-User Cursor

**Status:** Accepted
**Date:** 2026-01-25
**Supersedes:** none
**Superseded by:** none

---

## Context

Users must be able to resume sync after disconnection, replay missed
events, and detect gaps. We need a total ordering over the Admin's event
stream that every User can reference with a single integer.

Options:

1. Timestamps. Simple but unreliable: clock skew, ties, leap seconds.
2. Per-aggregate versions. Correct for concurrency but useless as a
   sync cursor.
3. A global monotonic sequence per project.

## Decision

Every event committed on the Admin is assigned the next value from a
single per-project counter (the global sequence). Users store their
position as an integer and request events `> cursor`.

Additionally, the User maintains per-table cursors for module-owned
projection tables, so a lagging module can resync without replaying the
whole stream.

## Consequences

Positive:

- One integer captures a User's entire sync position.
- Gap detection is trivial: `expected_next = cursor + 1`.
- Snapshot recovery is trivially addressable (snapshot covers
  `1..through_sequence`).
- Per-table cursors let individual modules progress independently.

Negative:

- The Admin serializes all writes through one counter. This is a natural
  bottleneck, but a single project's write volume is small (clinic / lab
  scale). Non-blocking at our target scale.

## Alternatives considered

**Timestamps.** Rejected: unreliable ordering. Would require tie-breakers
and still fail under clock skew.

**Per-aggregate only.** Rejected: no cursor semantics across aggregates.

**Vector clocks.** Rejected: overkill for a single-writer system (Admin).

## References

- docs/architecture/SYNC-PROTOCOL.md
- docs/architecture/01-PRINCIPLES.md rule 4