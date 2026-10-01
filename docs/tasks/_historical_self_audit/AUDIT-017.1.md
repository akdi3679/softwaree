# TASK ID: AUDIT-017.1
# TITLE: Self-audit fix #13: time zones, clock skew, and sync ordering
# STATUS: pending
# DEPENDENCIES: AUDIT-016.2
# ALLOWED FILES: docs/architecture/TIMEZONES-CLOCK-SKEW.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define how the system handles:
1. Events with timestamps in different time zones
2. Devices with wrong clocks
3. Sync ordering when clocks are off

## WHY THIS WAS FOUND IN SELF-AUDIT
Events have `occurred_at` and `recorded_at` timestamps. If the Admin
clock is wrong, events are timestamped wrong. If the User app's
clock is off by 5 minutes, sync ordering is ambiguous. Critical
for audit (legal) and for "show me what happened first".

## REQUIRED IMPLEMENTATION

Create `docs/architecture/TIMEZONES-CLOCK-SKEW.md`:

```markdown
# Time Zones, Clock Skew, and Sync Ordering

## The principle

All event ordering in the event_store is by **server-assigned
sequence number (seq)**, NOT by timestamp.

Timestamps are metadata, used for display. Sequence numbers are
the source of truth for ordering.

## Why

If we ordered by timestamp:
- Two devices with wrong clocks could create ambiguous order
- After sync, we'd have to re-order, leading to conflicts
- Audit logs would be untrustworthy (clock could be wrong)

If we order by sequence number:
- Admin assigns seq = max(seq) + 1 to each event
- All other devices see events in the same order
- No ambiguity
- Clock is for display only

## Timestamps

Every event has:
- `occurred_at` (string, ISO 8601) — when the event happened in real life
- `recorded_at` (string, ISO 8601) — when the event was appended to event_store
- `seq` (uint64) — the global sequence number, assigned by Admin

`seq` is the source of truth. `occurred_at` and `recorded_at` are
for display.

## How we handle clock skew

### On every device

- NTP sync (system time)
- Show a warning if clock is off by > 60 seconds from NTP
- Block writes if clock is off by > 5 minutes (we can't trust the
  timestamp for display)

### On the Admin

- Periodic NTP sync
- Reject events with `occurred_at` > 5 minutes in the future
- Reject events with `occurred_at` > 1 hour in the past (we should
  be recording in real time, not retroactively; retroactive entries
  are a separate flow)

### On the User app

- Show "Your clock is off by X minutes" if NTP detects drift
- Allow reads (sync), block commands (writes) if clock is very wrong

## Time zones

- All timestamps stored in UTC (ISO 8601 with Z suffix)
- All timestamps displayed in user's local time zone
- User's time zone is set in Settings
- We do NOT store the original time zone in the event (it can be
  inferred from the user's settings at the time of the event)
- For audit, we keep `recorded_at` in UTC only

## What if a customer operates across time zones?

- Each user has their own time zone in settings
- Events display in each user's local time
- A patient visit at 9:00 AM EST looks like 6:00 AM PST to the
  west-coast user
- The actual `seq` and `recorded_at` are the same; only display differs

## Edge case: "What time did this happen?"

If a user asks "when did this happen?", we show:
> 9:00 AM (your time) on 2026-08-09

We do NOT show the UTC time by default. UTC is for developers.

## What we do about wrong clocks in audit

If an audit reviewer wants to know "is this clock correct?", they
can look at the device's NTP sync log (we keep it for 90 days).

If the clock was wrong at the time of the event, the timestamp may
be off. We log a warning but don't reject.

## Tests

- [ ] Admin with correct clock: events are timestamped correctly
- [ ] Admin with clock 30 min ahead: warning shown, events allowed
- [ ] Admin with clock 5 min ahead: warning shown, events allowed
- [ ] Admin with clock 6 min ahead: warning shown, writes blocked
- [ ] Admin with clock 1 hour behind: writes blocked
- [ ] Event recorded "now" by Admin A, synced to User B 2 min later
- [ ] User B sees event with display time = Admin A's local time,
      not B's
- [ ] Two events recorded simultaneously on two devices: one seq
      number first, no ambiguity
- [ ] Audit log: review event, see device NTP sync status
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/TIMEZONES-CLOCK-SKEW.md || { echo "FAIL"; exit 1; }
grep -q "sequence number" docs/architecture/TIMEZONES-CLOCK-SKEW.md || { echo "FAIL"; exit 1; }
echo "OK"
```
