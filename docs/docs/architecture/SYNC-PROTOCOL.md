# Sync Protocol v1 (with Discovery)

> How Admin and User exchange data. Same protocol, different transport
> depending on what the runtime detects (LAN / direct / discovery / relay).

## Protocol version

`1`. v1 is the only supported version. v2 is in design.

## Stable IP addressing (from ADR-018, ADR-020)

Every device has a stable virtual IP from our private range:

| Role | IP |
|---|---|
| Admin | `10.50.0.1` |
| User 1 | `10.50.0.2` |
| User 2 | `10.50.0.3` |
| User N | `10.50.0.(N+1)` |

The `/16` range gives us 65,534 addresses per project.

**These IPs are stable for the device's lifetime.** They never change.

## Discovery (from ADR-020)

We run a small **discovery service** in our Cloud. It is a "phone book":

- Stores: device pubkey → last known public IP
- Receives: heartbeats from devices ("I'm at IP Y")
- Provides: lookups (Admin asks "where is X?")
- **Never sees data**, only IP metadata

This is the trade-off: we know your real IP, in exchange for easy
cross-network. Privacy-paranoid customers can opt out (use LAN or
customer relay instead).

## Transport (chosen at runtime)

When a User app wants to reach the Admin (`10.50.0.1:9090`):
Try LAN first (mDNS) — instant if same network

If not on LAN, try direct internet (cached last-known IP)

If fails, ask discovery: "where is 10.50.0.1?"

Try the IP discovery returned

If still fails, device is offline (or IP changed)

text

The application doesn't care which method is used. It just sends
to `10.50.0.1:9090`.

## Connection lifecycle

### Step 1: Heartbeat (background, every 60s)

Every device sends a heartbeat to discovery:

```http
POST /v1/discovery/heartbeat
Headers: X-Device-Id, X-Signature
Body: {
  "device_id": "dev_...",
  "virtual_ip": "10.50.0.1",
  "current_public_ip": "41.200.50.10",
  "current_public_port": 51820,
  "current_ipv6": "2001:db8::42",
  "state": "internet",  // or "lan", "offline"
  "reachable_methods": ["direct_v4", "direct_v6"],
  "timestamp": "2026-08-22T12:00:00Z"
}
No payload data. No "who I'm talking to". Just IP metadata.

Step 2: Try to reach the peer
When Admin wants to send to User (10.50.0.2):

text
1. Try mDNS for "10.50.0.2" on current LAN
   - If found, connect: Admin <-> User over LAN (mDNS+WireGuard)
   - If not found, go to step 2

2. Try direct internet (cached IP from last successful connect)
   - If works, connect
   - If fails, go to step 3

3. Ask discovery: GET /v1/discovery/lookup?virtual_ip=10.50.0.2
   - If 200: got the current IP
   - If 404: device is offline (not seen in 30 min)
   - If "no public IP": device opted out

4. Try the IP discovery gave
   - If works, connect, cache the IP
   - If fails, mark as offline
Step 3: Data flows directly
Once connected, data flows Admin ↔ User directly. No discovery
involvement. WireGuard provides E2E encryption.

text
Admin                                 User
  │                                    │
  │     WireGuard tunnel (E2E)         │
  │  ◄──────────────────────────────►  │
  │                                    │
  │  Discovery (we) is NOT here.       │
  │  We don't see this traffic.        │
  │                                    │
Frame format
All frames are CBOR-encoded:

text
┌─────────────┬─────────────┬────────────────┐
│ Frame type  │ Payload len │ Payload        │
│ (1 byte)    │ (4 bytes)   │ (variable)     │
└─────────────┴─────────────┴────────────────┘
Frame types:

SyncHello

SyncAck

EventBatch

SnapshotPayload

CommandRequest

CommandAckGotten

CommandApplyRequest

CommandApplied

CommandApplyConfirm

CommandResponse (for error responses or generic acknowledgement)

Heartbeat

Error

Two-Phase Commit Handshake (Write Path)
The write flow from User to Admin is a four-step handshake to ensure
Admin is the source of truth and applies before the User.

text
1. User sends a `CommandRequest` to Admin (contains command + idempotency key).
2. Admin responds `CommandAckGotten` (change held, not applied).
   Admin does NOT apply yet.
3. User sends `CommandApplyRequest` (asks Admin to apply).
4. Admin applies the command in a single transaction (data + event + audit + outbox).
   Admin then sends `CommandApplied` to the User.
5. User receives `CommandApplied`, then applies the change locally.
6. User sends `CommandApplyConfirm` to Admin (optional, for audit).
   If Admin does not receive confirmation, it relies on the event log to
   later sync the User if needed.
If the Admin goes offline after step 2 but before step 4, the User is
stuck with "pending" but in v1 the UI treats it as an error and
does not allow further action until Admin reconnects. The User can
re-send the same CommandRequest with the same idempotency key;
Admin deduplicates.

The Admin's CommandApplied is the definitive success signal.

Encryption
All frames are inside a WireGuard tunnel. WireGuard provides:

E2E encryption (ChaCha20-Poly1305)

Perfect forward secrecy (keys rotate every 2 minutes)

Replay protection

No additional TLS needed

What we never do
❌ Send sync traffic through our Cloud
❌ Relay any data through our servers
❌ Log message contents
❌ Log "who is talking to whom"
❌ See sync traffic
❌ Decrypt anything (we don't have keys)
❌ Use a third-party VPN (Tailscale, Headscale, etc.)

What we DO (the discovery service only)
✓ Receive heartbeats from devices
✓ Store: device_id → last known public IP
✓ Provide lookups: "where is virtual IP X?"
✓ Forget devices not seen in 7 days
✓ Allow opt-out (forget IP, no more heartbeats)