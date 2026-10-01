# TASK ID: AUDIT-014.1
# TITLE: Self-audit fix #10: WebSocket reconnection strategy
# STATUS: pending
# DEPENDENCIES: AUDIT-013.2
# ALLOWED FILES: docs/architecture/SYNC-RECONNECTION.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define what happens when the User app's WebSocket disconnects (network
blip, Admin restart, etc.). Without this, the spec is incomplete.

## WHY THIS WAS FOUND IN SELF-AUDIT
The SYNC-PROTOCOL.md describes the happy path. But networks are
unreliable. We need a defined reconnection strategy or the User app
will lose data.

## REQUIRED IMPLEMENTATION

Create `docs/architecture/SYNC-RECONNECTION.md`:

```markdown
# Sync Reconnection Strategy

## The problem

WebSockets are not reliable. They disconnect when:
- User's laptop sleeps
- WiFi changes
- Admin restarts
- Network blip (1-3 seconds)
- our mesh node temporarily unreachable
- DERP relay failover (5-10 seconds)

In all these cases, the User app must reconnect and not lose data.

## States

```
┌──────────┐  connect   ┌──────────┐  error    ┌──────────┐
│          │ ─────────► │          │ ────────► │          │
│  IDLE    │            │ CONNECTED│           │  RETRY   │
│          │ ◄───────── │          │ ◄──────── │          │
└──────────┘  close     └──────────┘  success  └──────────┘
```

## State: IDLE (no connection)

- App is on, but no Admin reachable
- Show "Looking for Admin..." with a spinner
- Try mDNS every 5 seconds
- Try the cached IP every 10 seconds
- Exponential backoff: 5s → 10s → 30s → 60s (max)
- After 5 minutes, show "Could not reach Admin. Tap to retry."
- Surface Admin's last-seen timestamp (e.g., "Last seen 2 hours ago")

## State: CONNECTED (WebSocket open)

- Normal operation
- Heartbeat ping every 30s
- If no pong in 60s, assume disconnected → RETRY
- If we receive events, apply them to local projection
- If we want to send a command, sign and send

## State: RETRY (reconnecting)

- Show "Reconnecting..." with smaller spinner
- Backoff schedule:
  - First attempt: immediate
  - If fail: wait 1s
  - If fail: wait 2s
  - If fail: wait 5s
  - If fail: wait 10s
  - If fail: wait 30s
  - Cap at 30s, retry forever (until user gives up)
- When reconnect succeeds: full sync (snapshot or events since cursor)
- After successful reconnect: reset backoff

## What if events were lost during disconnect?

Use the per-table cursor. On reconnect:
1. Send `SyncHello` with our cursor (last seq we have)
2. Server responds: events since cursor, OR full snapshot
3. If we missed > 5000 events: server sends full snapshot
4. If we missed < 5000 events: server sends just the missed events
5. Apply in order
6. Update cursor
7. Resume normal sync

## What if the user typed something while disconnected?

- Commands typed in User app are queued locally
- On reconnect: send queued commands in order
- Server processes each, may reject (e.g., version conflict)
- User sees status: "Sent" → "Applied" or "Rejected: ..."

## What if Admin was offline for hours?

- User app's projection is stale but readable
- New commands queue up
- On reconnect: massive batch of events
- Server sends full snapshot (we missed too many)
- User app rebuilds projection from snapshot
- User app sends its queued commands
- Some commands may fail (e.g., patient already discharged)

## What if Admin is permanently gone?

- Device lost / stolen / destroyed
- Use device replacement flow (see ADR-012)
- New Admin registers, takes over
- User apps automatically reconnect to new Admin
- All history preserved

## Tests

- [ ] Disconnect for 1 second, reconnect: should resume without data loss
- [ ] Disconnect for 1 minute, reconnect: should re-sync
- [ ] Disconnect for 1 hour, reconnect: should receive snapshot
- [ ] Disconnect for 1 day, reconnect: should fail with "Admin not seen in 24h, contact support"
- [ ] Send 100 commands while disconnected: all should be queued
- [ ] On reconnect: all 100 should be sent in order
- [ ] If 1 fails: show "1 of 100 failed: [reason]"
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/SYNC-RECONNECTION.md || { echo "FAIL"; exit 1; }
grep -q "Reconnect" docs/architecture/SYNC-RECONNECTION.md || { echo "FAIL"; exit 1; }
echo "OK"
```
