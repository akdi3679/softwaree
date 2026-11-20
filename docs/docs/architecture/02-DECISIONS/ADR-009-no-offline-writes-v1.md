# ADR-009: No Offline Writes in v1

**Status:** Accepted — amended 2026-11-20
**Date:** 2026-07-26
**Amended:** 2026-11-20 — status name unified to `ADMIN_OFFLINE`, keepalive named distinctly from the other two heartbeats, correct virtual IP, "applied but view catching up" clarified
**Deciders:** Architecture team
**See also:** ADR-002 (Admin is truth), ADR-012 (write path), ADR-018 / ADR-020 / ADR-024 (network), SYNC-PROTOCOL

---

## Context

The user stated: *"for now make if admin unreachable cant do any thing on app"* and *"if admin pc close the all operations cant done."*

When the Admin is offline, the User cannot perform any operation that requires Admin authority. The system must be honest: never tell a User "Success" when the authoritative Admin never received the operation.

The design question: should we support offline writes that sync when the Admin returns?

---

## Decision

**No offline writes in v1.** A write that cannot reach the Admin is rejected with a clear error. The User UI enters `ADMIN_OFFLINE` and cannot submit forms.

Operations that still work while the Admin is offline:
- Reading previously cached data (the User's authorised projection)
- Browsing the local UI
- Composing a draft locally (typing into a form) — but the form cannot be submitted
- Exporting the User's own authorised data (Principle 14)

In v2 we may add a per-command offline queue for selected low-risk operations. See "Future work".

### Status names (single vocabulary)

| State | Meaning | Writes |
|---|---|---|
| `ADMIN_ONLINE` | Session established, keepalives healthy | allowed |
| `ADMIN_OFFLINE` | Admin reachable recently but now unreachable, or explicitly reported down | refused |
| `ADMIN_UNKNOWN` | No path to the Admin at all; we cannot tell whether it is up | refused |

These three names are used identically in `01-PRINCIPLES.md` §3, the User UI, and the sync protocol. The error returned by the command-sending function is **`Error::AdminOffline`** (this replaces the older name `AdminUnavailable` everywhere in the document set).

---

## Consequences

### Positive
- **Implements the user's rule exactly.** No surprises, no fake success.
- **Massively simpler architecture.** No offline command queue, no conflict resolution, no merged state to debug.
- **No risk of lost data.** If the User cannot reach the Admin, the operation is refused.
- **No replay machinery on the User.** No queue persistence, no queue encryption, no queue migration.
- **Safer under revocation.** A queued command could carry data the user has since lost permission to send. Avoiding the queue avoids that class of bug.

### Negative
- **The User app is much less useful offline.** A secretary cannot add a patient while the Admin is down. This is by design.
- **Requires deliberate UX.** "You can browse, but you cannot edit" must look intentional, not broken.
- **Some real workflows suffer.** A clinic with spotty Wi-Fi will retry often. Accepted for v1; the v2 queue exists for exactly this.

### Neutral
- The User's local database still contains an `outbox` table, reserved for the future queue. It is **never written to in v1**.
- The User's `inbox` holds incoming events and works offline against the last delivered data.
- The Admin is a server process. Running it headless on an always-on mini-PC (ADR-002) removes most of the pain described above without changing this rule.

---

## User-facing UX

```
┌────────────────────────────────────────────┐
│ ⚠️  Admin is offline                        │
│                                            │
│ You can browse your previously-loaded      │
│ data, but you cannot make changes until    │
│ the Admin is back online.                  │
│                                            │
│ Last sync: 2 hours ago                     │
│ Try reconnecting →                         │
└────────────────────────────────────────────┘
```

All write controls are disabled with tooltips explaining why. Form fields are read-only. Typed draft text is preserved locally so nothing is lost when the Admin returns.

When the Admin comes back:
- The banner disappears
- A toast says "Connected to Admin"
- Write controls re-enable
- Nothing is auto-submitted (there is no queue in v1)

### One nuance that is NOT a pending write

With the one-round-trip write path (ADR-012, SYNC-PROTOCOL), the Admin commits the change and replies with the applied sequence. The User's local view then catches up via the event stream.

During that short catch-up window the UI may say **"Saved on Admin — updating your view."** This is not a pending write: the authoritative write **has already committed** on the Admin. It is a local projection lag, and it resolves through the normal event path. If the connection drops before the projection catches up, the write is still durable on the Admin and will arrive on reconnect.

The forbidden state is different: "we accepted your write locally and will tell the Admin later." That never exists in v1.

---

## Detection: how the User knows the Admin is offline

There are **three distinct keepalives** in this platform. They are never referred to by the same name:

| Name | Layer | Interval | Purpose |
|---|---|---|---|
| **WireGuard keep-alive** | tunnel | 25 s | Keeps NAT mappings and the tunnel alive (ADR-018) |
| **Admin session keepalive** | WebSocket, User ↔ Admin | 30 s | Liveness of the Admin session (this ADR) |
| **Discovery heartbeat** | HTTPS, device → Cloud | 60 s | Publishes the device's observed public IP (ADR-020) |

The User app tracks the **Admin session keepalive**:

```
- Persistent WebSocket connection to the Admin (when a path exists)
- Admin session keepalive (WS ping) every 30 seconds
- 3 consecutive missed keepalives → ADMIN_OFFLINE
- Successful keepalive → ADMIN_ONLINE
- Plus an active probe every 5 minutes over a separate channel, to catch silent failures
```

If the User has no path to the Admin's mesh endpoint at all — the project-namespaced virtual address, e.g. `(proj_a1b2c3, 10.50.0.1)` — the state is `ADMIN_UNKNOWN`: not "the Admin is down", but "we cannot tell". The UI consequence is identical: read-only.

---

## Why we do not trust a "pending" state in v1

Some systems show "your change is pending, it will sync when the Admin is back". That would require:

1. Storing the form data locally with status `PENDING_SYNC`
2. Showing "Pending" in the UI
3. Sending it as a command when the Admin returns
4. Re-authorising at send time (permissions may have changed)
5. Resolving conflicts against newer Admin state
6. Encrypting, migrating and recovering the queue

The user said no. The system refuses the operation instead. That is a stronger, simpler guarantee, and we honour it.

In v1 the form simply does not submit. The user sees: *"Cannot save while the Admin is offline. Please try again when the Admin is back."* Their typed text stays in the form.

---

## Why this is the right v1 choice

An offline queue requires solving:

- Idempotency on replay
- Conflict resolution against Admin state
- Authorisation re-check at sync time
- Schema migration of queued commands
- Encryption of queued commands at rest
- Recovery from a crash mid-queue
- Recovery from an uninstall with a pending queue
- UX for "you submitted this three days ago, here is what happened"
- Testing infrastructure for all of the above

That is a v2 product. v1 ships the honest "you cannot write right now" experience, reaches real users, and then adds offline writes for the operations that genuinely need them.

---

## Future work (v2)

```
Command OfflinePolicy:
- LOCAL_ONLY        (e.g. "draft note", no Admin needed)
- OFFLINE_QUEUEABLE (e.g. "schedule appointment for tomorrow", low risk)
- ADMIN_REQUIRED    (e.g. "issue final lab report", never offline)
- CLOUD_REQUIRED    (e.g. "change plan", needs the Cloud)
```

Every command declares its policy in the contract. The User queues `OFFLINE_QUEUEABLE` commands when the Admin is offline and rejects `ADMIN_REQUIRED`. The Admin re-validates authorisation on replay.

This is **not** v1. v1 has no offline writes anywhere.

---

## Alternatives Considered

### Full offline queue
**Pros:** maximum offline usability. **Cons:** complexity, conflict resolution, data-loss and security risk, heavy testing burden. **Rejected for v1:** the user explicitly asked for refusal.

### Optimistic local apply + background sync
**Pros:** instant-feeling UI. **Cons:** tells the user "Success" when the Admin never saw the change. **Rejected:** explicitly forbidden.

### Local-first with CRDTs
**Pros:** no offline gap. **Cons:** wrong tool for regulated medical and lab data, and it contradicts Admin-as-authority. **Rejected:** see ADR-002.

---

## Enforcement

- The User's command-submission function checks Admin availability first. If unavailable it returns `Error::AdminOffline` and the UI enters the read-only state.
- The User's `outbox` table exists in the schema but is never written in v1. Any write to it is a bug caught by a lint rule and a runtime assertion.
- The User's projection write paths are limited to internal system writes (applying an event from the inbox, applying a snapshot). The UI never writes to the projection directly.
- Lint rule: no User command handler may report success without a `CommandResponse` carrying an applied sequence from the Admin.
- The three keepalives are named distinctly in code, metrics and logs. A metric called `heartbeat_*` without a layer prefix fails review.

### Tests
- [ ] Admin process killed → `ADMIN_OFFLINE` within 3 keepalive intervals
- [ ] No network path at all → `ADMIN_UNKNOWN`
- [ ] Writes refused in both states, reads still work
- [ ] Draft text preserved across the offline period
- [ ] Admin returns → banner clears, controls re-enable, nothing auto-submits
- [ ] `outbox` remains empty after a full offline session
- [ ] Write committed on Admin, connection dropped before projection catch-up → UI shows "Saved on Admin", data arrives on reconnect