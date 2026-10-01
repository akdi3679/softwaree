# ADR-009: No Offline Writes in v1

**Status:** Accepted
**Date:** 2026-07-26
**Deciders:** Architecture team

---

## Context

The user stated: *"for now make if admin unreachable cant do any thing on app"* and *"if admin pc close the all operations cant done."*

This is a strong product requirement: when the Admin is offline, the User cannot perform any operation that requires Admin authority. The system should be honest about this — never tell the User "Success" when the authoritative Admin never received the operation.

The natural design question is: should we support offline writes that sync when the Admin returns?

## Decision

**No offline writes in v1.** A write that cannot reach the Admin is rejected with a clear error. The User sees a UI state of `ADMIN_UNAVAILABLE` and cannot submit forms.

The only operations that work offline are:
- Reading previously-cached data (the User's authorized projection)
- Browsing the local UI
- Composing a draft locally (e.g., typing in a form field) — but the form cannot be submitted

In v2 we may add a per-command offline queue for selected low-risk operations. See "Future work" below.

## Consequences

### Positive

- **Implements the user's stated rule exactly.** No surprises. The User is never told a write succeeded when it didn't.
- **Massively simpler architecture.** No offline command queue, no conflict resolution, no "merged" state to debug.
- **No risk of lost data.** If the User can't reach the Admin, the operation is refused. The data on the User's screen is honest.
- **No need for complex sync protocols.** The User app reads the projection and that's it. No command queue, no replay logic, no idempotency-key tracking on the User side.
- **Easier to reason about security.** A pending offline command would need to be encrypted, signed, replayed safely, and (importantly) could contain data the user has revoked permission to send. Avoiding that entirely is safer.

### Negative

- **The User app is significantly less useful offline.** If a secretary needs to add a new patient and the Admin is down, they cannot. This is by design.
- **Requires good UX to communicate the limitation.** A "you can browse, but you cannot edit" state must be clearly visible. The UI must not look "broken" — it must look "intentionally restricted."
- **Limits some real workflows.** A doctor in a clinic with spotty Wi-Fi would have to retry constantly. We accept this for v1; v2's offline queue is for this.

### Neutral

- The User's local database still has an `outbox` table for future offline queue use, but it's empty in v1.
- The User's local database has an `inbox` for incoming events, which works offline as long as the last sync delivered the data.

## User-Facing UX

When the Admin is unavailable, the User app shows:

```
┌────────────────────────────────────────────┐
│ ⚠️  Admin is offline                       │
│                                             │
│ You can browse your previously-loaded      │
│ data, but you cannot make changes until    │
│ the Admin is back online.                  │
│                                             │
│ Last sync: 2 hours ago                     │
│ Try reconnecting →                         │
└────────────────────────────────────────────┘
```

All write buttons are disabled with tooltips explaining why. Form fields are read-only. The UI is not broken; it is intentionally read-only.

When the Admin comes back:
- The "Admin is offline" banner disappears
- A toast says "Connected to Admin"
- Write buttons re-enable
- Pending operations are processed normally (none in v1, by definition)

## Detection: How the User Knows the Admin is Offline

The User app tracks the Admin's heartbeat:

```
- Persistent WebSocket connection to Admin (when network allows)
- Heartbeat every 30 seconds
- 3 missed heartbeats → ADMIN_UNAVAILABLE
- Successful heartbeat → ADMIN_ONLINE
- Plus periodic active probe (every 5 min) over a separate channel to detect silent failures
```

If the User can't even reach the Admin's network endpoint (WireGuard IP, e.g., 10.0.0.1), it's `ADMIN_UNKNOWN` (not "offline", but "can't tell"). The UI is the same: read-only.

## Why We Don't Trust the User's "Pending" State in v1

In some systems, the User app shows "your change is pending, will sync when Admin is back." We could do this in v1 by:

1. User fills a form
2. User clicks Save
3. Form data is stored locally with status `PENDING_SYNC`
4. UI shows "Pending — will sync when Admin is back"
5. When Admin comes back, the local data is sent as a command

The user said no. They want the system to refuse the operation. This is a stronger guarantee. We honor it.

In v1, the form will simply not submit. The user sees "Cannot save while Admin is offline. Please try again when the Admin is back." They can keep their typed data in the form, but they cannot save.

## Why This Is the Right v1 Choice

The alternative (offline writes with a queue) requires solving:
- Idempotency on replay
- Conflict resolution when the local draft conflicts with Admin state
- Authorization re-check at sync time (what if permissions changed?)
- Schema migration for queued commands
- Encryption of queued commands at rest
- Recovery from User app crash mid-queue
- Recovery from User app uninstall with pending queue
- UX for "you submitted this 3 days ago, here's what happened"
- Testing infrastructure for all of the above

That's a v2 product. v1 ships the honest "you can't write right now" experience, gets the platform out, learns from real usage, then adds offline writes for the operations that actually need them.

## Future Work (v2)

When we add offline writes, the design is:

```
Command OfflinePolicy:
  - LOCAL_ONLY        (e.g., "draft note", no Admin needed)
  - OFFLINE_QUEUEABLE (e.g., "schedule appointment for tomorrow", low risk)
  - ADMIN_REQUIRED    (e.g., "issue final lab report", cannot be done offline)
  - CLOUD_REQUIRED    (e.g., "change plan", cannot be done without Cloud)
```

Each command in the system declares its policy in its contract. The User app queues commands marked `OFFLINE_QUEUEABLE` when Admin is offline; rejects commands marked `ADMIN_REQUIRED`. The Admin re-validates authorization on replay.

This is **not** v1. v1 is no offline writes anywhere.

## Alternatives Considered

### Full offline queue (everything queues when offline)

**Pros:** maximum offline usability.
**Cons:** massive complexity; conflict resolution; data loss risk; security risk; testing burden.
**Rejected for v1 because:** the user explicitly asked for "if admin unreachable, can't do anything."

### Optimistic local + background sync

**Pros:** UI feels instant.
**Cons:** violates the user's rule; tells the user "Success" when the Admin never saw the change.
**Rejected because:** explicitly forbidden by the user.

### Local-first with eventual consistency (CRDTs)

**Pros:** no offline gap.
**Cons:** wrong tool for the data (medical, financial, regulated).
**Rejected because:** the user wants Admin as authority, not peer-to-peer.

## Enforcement

- The User app's command-submission function checks Admin availability before sending. If unavailable, the function returns `Error::AdminUnavailable` and the UI shows the read-only state.
- The User app's `outbox` table is reserved (exists in schema) but is never written to in v1. A code path that writes to it in v1 is a bug.
- The User app's local projection write paths are limited to internal system writes (e.g., applying an incoming event from the inbox). The User's UI never writes to the projection directly.
- A linter rule: no command-handler code in the User app can mark itself "succeeded" without an `ADMIN_OK` response from the Admin.
