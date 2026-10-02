# ADR-009: No Offline Writes In v1

**Status:** Accepted
**Date:** 2026-02-12
**Supersedes:** none
**Superseded by:** none

---

## Context

The Admin is the sole source of truth (ADR-002). A User must not write
authoritative state. But users legitimately want to keep working when the
Admin is temporarily unreachable (laptop closed, mesh momentarily down).

Options:

1. Allow offline writes on the User, queue them, sync later.
2. Reject all writes when the Admin is unreachable.
3. Allow a restricted subset of low-risk writes (comments, annotations)
   offline; reject the rest.

## Decision

v1: option 2 — no offline writes.

If the Admin is unreachable:

- The User app shows **ADMIN_OFFLINE**.
- Every write attempt is rejected with a clear error.
- The UI never shows "Success" for a write that was not accepted by the
  Admin.

The transport uses a four-step handshake (CommandRequest -> AckGotten ->
ApplyRequest -> Applied). If any step fails, the command is rejected.
There is no PENDING state stored on the User.

v2 may add option 3 for a small allow-list of "annotation-like" commands,
behind a feature flag. Any such write must be non-authoritative and
reconcilable.

## Consequences

Positive:

- Users never see a "success" that later turns out to be false.
- No conflict resolution needed. The Admin is the only writer.
- No queue replay logic on the User. Much less code, much less to audit.
- The UI state machine is trivial: online / offline.

Negative:

- A user who is on a plane cannot register a patient. This is the
  correct business behavior for a clinical system.

## Alternatives considered

**Full offline write support.** Rejected: would require merge strategy,
conflict UI, and would weaken the Admin-as-truth invariant.

**Queue-and-hope.** Rejected: as soon as the queue contains a command
that later fails, the UI is lying to the user.

**Optimistic UI with rollback.** Rejected: user sees a "success" that is
later silently rolled back. Unacceptable in a medical context.

## References

- docs/architecture/01-PRINCIPLES.md rule 3
- docs/architecture/SYNC-PROTOCOL.md