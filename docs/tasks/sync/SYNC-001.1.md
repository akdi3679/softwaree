# TASK ID: SYNC-001.1
# TITLE: Add sync protocol v1 spec document
# STATUS: pending
# DEPENDENCIES: RELEASE-001.5
# ALLOWED FILES: /workspace/docs/architecture/SYNC-PROTOCOL.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Document the sync protocol between Admin and User (handshake, messages, error codes).

## REQUIRED IMPLEMENTATION

Create `/workspace/docs/architecture/SYNC-PROTOCOL.md`:

```markdown
# Sync Protocol v1

The User → Admin sync protocol. Both Admin and User are required to implement this spec to interop.

## Transport

- TCP, then upgraded to WebSocket (RFC 6455)
- The Admin listens on `0.0.0.0:9420` (or `100.x.y.z:9420` on our WireGuard mesh)
- The User is the client

## Frame format

All frames are UTF-8 JSON. Each is one of:

### Client → Server

```typescript
type ClientMessage =
  | { type: "hello", protocol_version: 1, user_id: string, device_id: string, project_id: string, device_pubkey: string, device_signature: string }
  | { type: "sync_request", last_sequence: number, max_events: number | null }
  | { type: "ack", acked_through_sequence: number }
  | { type: "heartbeat" };
```

### Server → Client

```typescript
type ServerMessage =
  | { type: "welcome", session_id: string }
  | { type: "sync_response", mode: "events", from_sequence: number, to_sequence: number, events: WireEvent[], has_more: boolean }
  | { type: "sync_response", mode: "snapshot", at_sequence: number, data: Projection }
  | { type: "event", event: WireEvent }
  | { type: "error", code: ErrorCode, message: string, retryable: boolean }
  | { type: "heartbeat_ack" };
```

## Handshake

1. User connects to `ws://admin:9420/sync`
2. User sends `hello` with signed payload: `signature = ed25519.sign(device_sk, "hello" + protocol_version + user_id + project_id)`
3. Admin verifies signature against `device_pubkey`
4. Admin checks the user is a member of the project
5. Admin sends `welcome { session_id }`
6. User can now send `sync_request`

## Event flow

1. User sends `sync_request { last_sequence: <its position> }`
2. Admin checks if the gap is too large (see ADR-005)
3. If gap too large: Admin sends `sync_response { mode: "snapshot" }` with the full projection
4. Otherwise: Admin sends `sync_response { mode: "events" }` with up to `max_events` events
5. User applies events idempotently
6. User sends `ack { acked_through_sequence: <max sequence it applied> }`
7. Admin advances the projection cursor

## Push

When the Admin receives a new event:
1. Find all connected users for this project
2. Send `event { event }` to each (only if they're authorized to see this event)
3. On `ack`, advance the cursor

## Heartbeat

Either side may send `heartbeat`. The other must respond with `heartbeat_ack` within 30s. After 3 missed heartbeats, the connection is considered dead.

## Error codes

| Code | Meaning | Retryable |
|------|---------|-----------|
| `PROTOCOL_VERSION_UNSUPPORTED` | Hello carries a version we don't support | false |
| `INVALID_SIGNATURE` | Hello signature doesn't verify | false |
| `NOT_AUTHORIZED` | User is not a member of this project | false |
| `PROJECT_SUSPENDED` | Project is suspended | true |
| `RATE_LIMITED` | Too many requests | true |
| `INTERNAL` | Server error | true |
| `INVALID_FRAME` | Malformed message | false |

## Versioning

- `protocol_version` is an integer
- Server supports the highest version it knows; rejects higher
- Client must send its highest version
- Backward compatibility: server must support version 1 forever

## Security

- All frames are over TLS (via our WireGuard mesh)
- Hello signature is mandatory
- No frame may be sent before Welcome
- Maximum frame size: 1 MB
- Heartbeat interval: 30s
- Heartbeat timeout: 3x interval
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/SYNC-PROTOCOL.md || { echo "FAIL"; exit 1; }
grep -q "Sync Protocol" docs/architecture/SYNC-PROTOCOL.md || { echo "FAIL"; exit 1; }
grep -q "heartbeat" docs/architecture/SYNC-PROTOCOL.md || { echo "FAIL: no heartbeat"; exit 1; }
echo "OK"
```
