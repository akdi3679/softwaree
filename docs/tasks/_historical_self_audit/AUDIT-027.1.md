# TASK ID: AUDIT-027.1
# TITLE: Self-audit fix #23: SYNC-PROTOCOL integrate ADR-018 (stable IP)
# STATUS: pending
# DEPENDENCIES: AUDIT-026.2
# ALLOWED FILES: docs/architecture/SYNC-PROTOCOL.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
The SYNC-PROTOCOL.md needs to explicitly reference the stable IP
(10.0.0.x) from ADR-018. Without this, the spec is internally
inconsistent.

## WHY THIS WAS FOUND IN SELF-AUDIT
ADR-018 says devices have stable IPs (10.0.0.1, .2, .3). The sync
protocol needs to use these IPs explicitly. The current spec talks
about "Admin's address" without specifying it.

## REQUIRED IMPLEMENTATION

Update `docs/architecture/SYNC-PROTOCOL.md` — add a new section
right after the protocol version:

```markdown
## Stable IP assignment (from ADR-018)

Every device in a project has a stable IP from a private range:

| Role | IP | Notes |
|---|---|---|
| Admin | `10.0.0.1` | Always the first device in the project |
| User 1 | `10.0.0.2` | First invited user |
| User 2 | `10.0.0.3` | Second invited user |
| ... | `10.0.0.x` | Sequential |

These IPs are:
- **Stable**: don't change as device moves networks
- **Private**: not routable from the public internet
- **Assigned by us**: stored in the project config, not by a server
- **Used for sync**: WebSocket connection from User to `10.0.0.1:9090`

The application doesn't care how the IP is reached (mDNS, IPv6,
static IP, customer relay). The OS handles routing.

## How WebSocket connects

```
User app → "connect to 10.0.0.1:9090"
        → OS looks up "how to reach 10.0.0.1"
        → finds WireGuard interface
        → WireGuard routes via mDNS/IPv6/static-IP/relay
        → arrives at Admin's actual address
        → Admin's Rust backend listens on 10.0.0.1:9090
        → WebSocket opens
        → SyncHello sent
```

If the connection fails, the OS tries the next route. The application
sees "reconnecting" until success.

## What this means for the protocol

The sync protocol is unchanged. Only the addressing layer changed.

Frame format: same as before.
SyncHello: same as before.
Event types: same as before.

Only the "where" of the connection changed. The "what" didn't.
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/SYNC-PROTOCOL.md || { echo "FAIL"; exit 1; }
grep -q "10.0.0.1" docs/architecture/SYNC-PROTOCOL.md || { echo "FAIL: no stable IP"; exit 1; }
echo "OK"
```
