# Sync Protocol v1 (with Discovery)

> How Admin and User exchange data. Same protocol, different transport
> depending on what the runtime detects (LAN / direct / discovery / relay).

## Protocol version

`1`. v1 is the only supported version.

## Stable IP addressing

Every device has a stable virtual IP from our private range `10.50.0.0/16`:

| Role | IP |
|---|---|
| Admin | `10.50.0.1` |
| User 1 | `10.50.0.2` |
| User 2 | `10.50.0.3` |
| User N | `10.50.0.(N+1)` |

These IPs are stable for the device's lifetime.

## Transport (chosen at runtime)

Try LAN first (mDNS) -> direct internet (cached last-known) -> ask discovery -> try discovery result.

The application does not care which method is used; it sends to `10.50.0.1:9090`.

## Frame format

All frames are CBOR-encoded with a 1-byte type, 4-byte payload length, then payload:

| Frame | Hex | Direction |
|---|---|---|
| SYNC_HELLO | 0x01 | User -> Admin |
| SYNC_WELCOME | 0x02 | Admin -> User |
| SYNC_REQUEST | 0x03 | User -> Admin |
| SYNC_RESPONSE | 0x04 | Admin -> User |
| EVENT | 0x05 | Admin -> User |
| SNAPSHOT | 0x06 | Admin -> User |
| ACK | 0x07 | User -> Admin |
| COMMAND_REQUEST | 0x10 | User -> Admin |
| COMMAND_ACK_GOTTEN | 0x11 | Admin -> User |
| COMMAND_APPLY_REQUEST | 0x12 | User -> Admin |
| COMMAND_APPLIED | 0x13 | Admin -> User |
| COMMAND_APPLY_CONFIRM | 0x14 | User -> Admin |
| COMMAND_RESPONSE | 0x15 | Admin -> User |
| HEARTBEAT | 0x20 | both |
| HEARTBEAT_ACK | 0x21 | both |
| ERROR | 0x7F | both |

## Handshake

1. User connects to Admin (`10.50.0.1:9420`).
2. User sends SYNC_HELLO with `user_id, device_id, project_id, device_pubkey, device_signature, protocol_version`.
   Signature input: `hello || protocol_version || user_id || project_id`, Ed25519, base64.
3. Admin verifies signature against `device_pubkey`.
4. Admin checks the user is a member of the project.
5. Admin sends SYNC_WELCOME with `session_id`.
6. User can now send SYNC_REQUEST / COMMAND_REQUEST / HEARTBEAT.

## Event flow

1. User sends SYNC_REQUEST with `last_sequence`.
2. Admin checks gap thresholds (5000 events OR 7 days).
3. If gap too large: Admin sends SNAPSHOT at current sequence.
4. Else: Admin sends SYNC_RESPONSE with up to `max_events` events.
5. User applies events idempotently, then sends ACK with `acked_through_sequence`.

## Two-phase commit handshake (write path)

1. User sends `COMMAND_REQUEST` (command + idempotency key).
2. Admin responds `COMMAND_ACK_GOTTEN` (held, not applied).
3. User sends `COMMAND_APPLY_REQUEST`.
4. Admin applies in a single transaction (data + event + audit + outbox).
5. Admin sends `COMMAND_APPLIED`.
6. User applies the change locally, then sends `COMMAND_APPLY_CONFIRM`.

If Admin goes offline between 2 and 4, User may re-send the same request with the same
idempotency key; Admin deduplicates. `COMMAND_APPLIED` is the definitive success signal.

## Heartbeat

Either side may send HEARTBEAT every 30s. The peer responds HEARTBEAT_ACK within 30s.
After 3 missed heartbeats, the connection is considered dead and reconnection begins.

## Reconnection

On drop: immediate retry -> self-test -> pick new path -> exponential backoff
(1s, 2s, 5s, 10s, 30s, cap 30s), forever until restored or user gives up.

## Error codes

| Code | Meaning | Retryable |
|---|---|---|
| PROTOCOL_VERSION_UNSUPPORTED | Hello carries a version we do not support | false |
| INVALID_SIGNATURE | Hello signature does not verify | false |
| NOT_AUTHORIZED | User is not a member of this project | false |
| PROJECT_SUSPENDED | Project is suspended | true |
| RATE_LIMITED | Too many requests | true |
| INTERNAL | Server error | true |
| INVALID_FRAME | Malformed message | false |

## Versioning

- protocol_version is an integer.
- Server supports the highest version it knows; rejects higher.
- Server must support version 1 forever.

## Security

- All frames are inside the WireGuard tunnel. Additional TLS not required.
- Hello signature is mandatory.
- No frame may be sent before WELCOME.
- Max frame size: 1 MB.
- Heartbeat interval: 30s. Timeout: 3x interval.

## What we never do

- Send sync traffic through our Cloud
- Relay any data through our servers
- Log message contents
- Log who is talking to whom
- See sync traffic
- Decrypt anything (we do not have keys)
- Use a third-party VPN

## Discovery service (Cloud, out of data path)

- Receives heartbeats (device_id -> last known public IP)
- Provides lookups ("where is virtual IP X?")
- Forgets devices not seen in 7 days
- Allows opt-out
