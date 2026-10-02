# Data flow

The end-to-end flow of a single command from a User pressing a button to the event being projected to all connected Users.

## Write path




User (UI)
-> Admin (Tauri): invoke('invite_user', { projectId, email, role })
-> Admin: validate + authorize
-> Admin: build event payload
-> Admin (SQLite): BEGIN, write data changes, insert outbox, insert audit, COMMIT
-> Admin: wake outbox dispatcher
-> Mesh: for each connected User, push event
-> User (Tauri): verify signature, check sequence against cursor, apply to projection
-> User -> Mesh: ack { acked_through_sequence }
-> Mesh -> Admin: ack
-> Admin: advance user_projection cursor

## Failure modes

### Admin crashes between BEGIN and COMMIT
Transaction rolls back. No event, no audit. User retries.

### Admin crashes between COMMIT and dispatch
Event is in outbox. On restart, dispatcher reads outbox and pushes missing events. Users receive on reconnect (idempotent).

### Mesh connection drops mid-dispatch
User read task sees disconnect, auto-reconnects, requests sync from last cursor. Admin sends missing events.

### User crashes mid-apply
Projection may be inconsistent. On restart, User checks cursor against projection; requests snapshot if broken.

### Views diverge
Admin is authoritative. Snapshot is forced if gap exceeds 5,000 events or 7 days.

## Latency targets

| Step | Target |
|---|---|
| Click to Admin receives | under 50ms loopback |
| SQLite commit | under 30ms |
| Dispatch to 10 Users | under 100ms |
| User receives event | under 50ms |
| Apply to projection | under 30ms |
| UI updates | under 50ms |
| Total | under 350ms p99 |

## Read path

Reads are local to the User. No Admin round-trip, no Cloud.

User UI -> User Tauri: list_projection('users')
User Tauri -> User SQLite: SELECT * FROM projection_users
User SQLite -> User Tauri: rows
User Tauri -> User UI: rows

## Why this design

- Local-first: User is fully functional with a stale view; only writes need Admin.
- One writer: Admin is the single source of truth. No coordination needed.
- Pull with push accelerator: Users can pull on demand, or be pushed to.
- Idempotent: All events are safe to replay.
- Bounded lag: 5K/7d gap threshold forces a snapshot.