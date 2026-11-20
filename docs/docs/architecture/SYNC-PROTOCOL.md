# Sync Protocol v1

> **Status:** Locked
> **Last updated:** 2026-11-20
> How Admin and User exchange data. One protocol, several possible transports.
> **See also:** ADR-004 (sequence), ADR-008 (snapshots), ADR-009 (no offline writes), ADR-012 (permissions + key delivery), ADR-017/018/019/020/024 (network)

---

## 1. Protocol version

`1`. v1 is the only supported version. The major version must match exactly; there is no silent fallback. v2 is not designed yet.

---

## 2. Addressing

Every device has a stable virtual address **inside its project's namespace**, from `10.50.0.0/16`:

| Role | Address within the project |
|---|---|
| Admin | `10.50.0.1` |
| User 1 | `10.50.0.2` |
| User 2 | `10.50.0.3` |
| User N | `10.50.0.(N+1)` |

- An address is always the pair **`(project_id, virtual_ip)`**. A bare IP is never a valid lookup key.
- The `/16` gives 65,534 usable addresses per project.
- Addresses are stable for the device's lifetime **within that project**. A device in two projects has two addresses and two tunnels, each with its own local UDP port.
- **The public key is the identity. The address is not a credential.** Every session is authenticated by the peer's key and certificate.
- The tunnel runs **in userspace inside the app**. No OS route is touched (ADR-024).

The Admin's sync endpoint inside the tunnel is port **9090** (WebSocket). The WireGuard UDP port is per project (base 51820 + project index).

---

## 3. Transport ladder

```
1. LAN — mDNS service lookup keyed by the device-key fingerprint
2. Cached direct endpoint (last successful public IP:port)
3. Discovery lookup — GET /v1/discovery/lookup?project_id=…&virtual_ip=…
4. Try the returned endpoint
5. Discovery-coordinated UDP hole-punch — POST /v1/discovery/punch, then poll rendezvous
6. Relay — customer-hosted, else opt-in blind relay (POST /v1/relay/session)
     TCP/443 carrier if UDP is blocked
7. No path → ADMIN_UNKNOWN / ADMIN_OFFLINE on the User
```

**LAN is always tried first, before and after any discovery interaction.** The cheapest working path wins. The application layer does not know which path is in use.

---

## 4. Discovery (metadata only)

Our Cloud runs a phone book:
- Stores **`(project_id, virtual_ip)` → observed public endpoint**, taken from the packet source, never self-reported
- Receives heartbeats every **60 s** (max 1/min/device)
- Answers project-scoped, signed, replay-protected lookups
- Coordinates hole-punching (rendezvous + short-poll, ADR-020)
- **Never sees data**

**Honest limit:** a lookup reveals that *device A asked about device B*. That is logged for 30 days and visible to the customer. We never see contents, payloads or durations, and we do not claim zero knowledge of contact intent (ADR-020).

Customers may opt out; LAN, QR/manual pairing and relays still work.

---

## 5. Three keepalives — never called "the heartbeat"

| Name | Layer | Interval | Failure rule |
|---|---|---|---|
| **WireGuard keep-alive** | tunnel | 25 s | 120 s silence → path considered dropped |
| **Admin session keepalive** | WebSocket, User ↔ Admin | 30 s | 3 missed → `ADMIN_OFFLINE` |
| **Discovery heartbeat** | HTTPS, device → Cloud | 60 s | 30 min unseen → lookup returns 404 |

Plus an active probe every 5 minutes over a separate channel to catch silent failures.

---

## 6. Connection lifecycle

### Step 1 — `SyncHello` / `SyncAck`

```
User → Admin: SyncHello {
  protocol_version: 1,
  app_version, core_version,
  project_id, device_pubkey,
  membership_cert,                 // Cloud-signed, verified locally
  module_versions: [{module_id, module_version, api_version}],
  max_frame_size,
  cursor, permission_version,
  acked_purge_version?             // confirms the highest contiguous purge applied
}

Admin verifies:
  - certificate signature chains to the embedded Cloud root
  - certificate not expired, not locally revoked
  - device is an active member of THIS project
  - protocol major version == 1
  - module API compatibility

Admin → User: SyncAck {
  session_id,
  admin_authority_cert,            // User verifies this too
  current_sequence,
  permission_version,
  module_versions,
  delivery_mode: "delta" | "snapshot_full" | "snapshot_partial" | "snapshot_module_refresh",
  max_frame_size
}
```

Any mismatch → `Error` with a typed code, then close. **Never silent corruption, never a partial handshake.**

### Step 2 — `SyncRequest`

```
User → Admin: SyncRequest { cursor, permission_version, acked_purge_version? }
```

The Admin decides delivery mode via `decide_delivery_mode(member, gap)` (ADR-008) — the only function that may make this choice.

### Step 3 — data flows directly

```
Admin                                    User
  │                                       │
  │      WireGuard tunnel (E2E)           │
  │ ◄───────────────────────────────────► │
  │                                       │
  │  Discovery is NOT in this path.       │
  │  A blind relay, if used, sees only    │
  │  ciphertext it cannot read or forge.  │
```

---

## 7. Frame format

All frames are CBOR-encoded:

```
┌─────────────┬─────────────┬────────────────┐
│ Frame type  │ Payload len │ Payload        │
│ (1 byte)    │ (4 bytes)   │ (variable)     │
└─────────────┴─────────────┴────────────────┘
```

**Max frame size: 16 MB.** An over-limit frame is rejected and logged. Larger payloads are chunked.

| Code | Frame | Direction | Purpose |
|---|---|---|---|
| `0x01` | `SyncHello` | U → A | Version + certificate + module negotiation |
| `0x02` | `SyncAck` | A → U | Agreed versions, session, delivery mode |
| `0x03` | `SyncRequest` | U → A | Resume from cursor; ack purges |
| `0x04` | `EventBatch` | A → U | Range-declared events + explicit skips + wrapped keys |
| `0x05` | `SnapshotPayload` | A → U | Chunked projection snapshot + wrapped keys |
| `0x06` | `SnapshotRequest` | U → A | Re-request a snapshot or missing chunks |
| `0x07` | `CommandRequest` | U → A | One-round-trip write |
| `0x08` | `CommandResponse` | A → U | Applied sequence, or typed error |
| `0x09` | `Purge` | A → U | Delete revoked resources + their keys |
| `0x0A` | `SessionKeepalive` | both | 30 s liveness |
| `0x0B` | `Error` | both | Typed failure, then close if fatal |

Eleven frame types. There is no `CommandAckGotten`, `CommandApplyRequest`, `CommandApplied` or `CommandApplyConfirm` — the five-message handshake was removed (see §9).

---

## 8. `EventBatch`

```
EventBatch {
  batch_id,
  range_start, range_end,          // "everything you may see in this range"
  permission_version,
  events: [ EventEnvelope ],
  skipped: [ { sequence, reason: "denied" | "module_incompatible" } ],
  key_wraps: [ { resource_id, wrapped_key } ],   // sensitive events only;
                                                 // resource key wrapped to THIS
                                                 // member's X25519 key (ADR-012 §5)
  signature                        // Admin device Ed25519 over JCS(payload minus signature)
}
```

Event envelope (minimum): `sequence`, `resource_type`, `resource_id`, `module_id`, `actor_id`, `project_id`, `event_version`, `payload`, `idempotency_key`, optional `supersedes_event_id`.

User rules:
1. Verify the Admin signature.
2. Apply events in sequence order through the single `apply_event` function.
3. Record every skip with its reason.
4. Set cursor = `range_end`.
5. Never advance past a range not received.

Max 500 events per batch. Larger gaps are split into consecutive batches, or replaced by a snapshot.

---

## 9. Write path — one round trip

There is **no held or pending state on the Admin** (Principle 3), and the User **never applies a write locally**.

```
1. User → CommandRequest {
     command_id, idempotency_key, expected_version,
     module_id, api_version, command_type, payload
   }

2. Admin: validate → authorize (current permissions) → check expected_version
          → apply in ONE transaction:
             event + apply_event + audit + outbox
          → or reject with a typed error

3. Admin → CommandResponse { command_id, ok: true, applied_sequence,
                             aggregate_version }
   or    → Error { code: "ConflictError", current_version, … }

4. Admin emits the EventBatch containing the new event immediately.

5. User does NOT apply anything locally. It waits until its projection cursor
   reaches applied_sequence. The UI shows success only when the projection
   has caught up. Wire ordering does not matter — the User buffers.
```

**Retries.** Same `idempotency_key` → the Admin returns the original result from `command_log`. No second event.

**Admin goes offline mid-request.** The User shows `ADMIN_OFFLINE`, never "pending". If the command had already committed, it is durable and arrives on reconnect.

**Projection lag.** If the cursor has not reached `applied_sequence` within 10 s, the UI says **"Saved on Admin — updating your view."** The authoritative write has committed; this is local lag, not a pending write (ADR-009).

**Optimistic concurrency.** A stale `expected_version` → `ConflictError` with the current version. The User re-reads and retries deliberately. No last-write-wins, no auto-merge.

Typed error codes: `ValidationError`, `AuthorizationError`, `ConflictError`, `ModuleVersionMismatch`, `AdminOffline`, `NetworkError`, `FrameTooLarge`, `SnapshotIncomplete`, `VersionMismatch`.

---

## 10. `SnapshotPayload`

```
SnapshotPayload {
  snapshot_id, project_id, user_id,
  sequence, permission_version,
  scope: "full" | "partial" | "module_refresh",
  granted_resources?,               // present when scope = partial
  refresh_module?,                  // present when scope = module_refresh
  schema_version, projection_format_version,
  chunk_index, chunk_count,
  tables: { "proj_*": [ rows ] },
  keys: [ { resource_id, wrapped_key } ],  // resource keys wrapped to this
                                           // member's X25519 key (ADR-012 §5)
  signature                         // over the COMPLETE reassembled payload
}
```

- Chunk payload target 8 MB; hard frame limit 16 MB.
- The User buffers chunks, verifies the signature over the complete payload, then applies **atomically** by scope:
  - `full` → wipe the projection, insert all rows.
  - `partial` → insert the listed resources additively; never delete.
  - `module_refresh` → delete that module's rows, then insert; never touch other modules.
  Then unwrap and store the `keys`, set cursor = `sequence`, set `permission_version`.
- Re-applying the same `snapshot_id` is a no-op.
- Incomplete transfer → `SnapshotRequest` for the missing chunks; after 60 s the User abandons and keeps its old cursor.
- **A snapshot never enters `events`.**

---

## 11. `Purge`

```
Purge {
  purge_id, purge_version, permission_version,   // purge_version is a per-member
                                                 // monotonic counter
  scope: "resources" | "resource_type" | "all",
  resources: [ { resource_type, resource_ids[] } ],
  signature
}
```

The User deletes the matching projection rows **and its local copies of those resources' keys** in one transaction, drops its own cached snapshots for those resources, and acknowledges by carrying `acked_purge_version` (the highest contiguous purge_version applied) in its next `SyncRequest`. Multiple pending purges are all covered this way. If module access was revoked, the bundle and unwrapped content key are deleted and frames closed (ADR-011).

**Honest limit:** purge is best-effort. Data already displayed cannot be un-seen, and a device that never reconnects cannot be reached. What we guarantee: no further delivery, deletion of rows **and keys** on next contact, and an audited revocation record.

---

## 12. Encryption and authentication

All frames travel inside the WireGuard tunnel:
- ChaCha20-Poly1305 AEAD, Curve25519 key agreement
- Session keys rotate (≈ every 2 minutes or 2^60 messages)
- Replay protection via the protocol's counter window
- No additional TLS is required inside the tunnel

**Precise claim:** a later session-key compromise does not expose earlier sessions. A **static** device-key compromise enables impersonation — which is exactly why device revocation, certificate epochs and the recovery ceremony exist (ADR-010, ADR-022).

**Why payloads are also signed by the Admin device:** WireGuard authenticates the peer on the wire; the Ed25519 signature makes an event batch or snapshot verifiable when it is stored, re-served from cache, or carried by USB sneakernet. Two different jobs, two different mechanisms.

The blind relay never terminates the tunnel and holds no key material. It can drop packets; it cannot read or forge them.

---

## 13. Limits

| Surface | Limit |
|---|---|
| Frame | 16 MB |
| Events per batch | 500 |
| Snapshot chunk payload | 8 MB target |
| Command payload | 1 MB |
| Commands per device | 100 / s |
| In-flight commands per session | 20 |
| Command response timeout | 10 s |
| Snapshot reassembly timeout | 60 s |
| Concurrent connections per User | 4 |
| Session keepalive | 30 s (3 missed → offline) |

Every exceeded limit is rejected and logged.

---

## 14. Sneakernet

USB transfer carries **signed `SnapshotPayload` artifacts only**. No commands, no events, no writes cross this path — the single-writer rule is preserved (ADR-002). Import runs the same signature and format verification and applies atomically.

---

## 15. What we never do

- ❌ Send sync traffic through our Cloud
- ❌ Relay any **readable** data through our servers (the opt-in blind relay forwards only ciphertext — ADR-024)
- ❌ Log message contents
- ❌ Log message-level "who is talking to whom" (discovery lookups do reveal lookup intent — disclosed in ADR-020)
- ❌ Decrypt anything (we hold no device private keys)
- ❌ Use a third-party VPN
- ❌ Let the User apply a write locally
- ❌ Accept a snapshot into the event log
- ❌ Transmit a resource key in plaintext (always wrapped to the recipient's X25519 key)

## 16. What we do (discovery only)

- ✓ Receive signed heartbeats
- ✓ Store `(project_id, virtual_ip)` → **observed** public endpoint
- ✓ Answer project-scoped, replay-protected lookups
- ✓ Coordinate hole-punching (rendezvous + short-poll)
- ✓ Forget endpoints after 7 days without heartbeats; lookup logs after 30 days
- ✓ Honour opt-out immediately

---

## 17. Tests

- [ ] `SyncHello` with protocol major 2 → typed `VersionMismatch`, connection closed
- [ ] Forged membership certificate → refused at handshake
- [ ] Forged Admin authority certificate → User refuses to sync
- [ ] Frame of 16 MB + 1 byte → rejected, logged
- [ ] Batch with a gap and no skip entry → rejected as a protocol violation
- [ ] Denied events → explicit skips, cursor at `range_end`
- [ ] `CommandRequest` retried with the same key → one event, original result
- [ ] Stale `expected_version` → `ConflictError` with current version
- [ ] Response arrives before the batch, and after the batch → both resolve correctly
- [ ] Admin killed after commit, before response → write durable, arrives on reconnect
- [ ] User never writes a business table during any write path
- [ ] Snapshot > 16 MB → chunked, reassembled, applied atomically
- [ ] Interrupted snapshot → old cursor retained, chunks re-requested
- [ ] Re-applied `snapshot_id` → no-op
- [ ] `Purge` → rows **and keys** deleted, caches dropped, `acked_purge_version` carried in next `SyncRequest`
- [ ] Multiple pending purges → both applied; `acked_purge_version` reflects the higher one
- [ ] LAN chosen when available, even with a working relay
- [ ] Discovery down → cached endpoint and LAN still work
- [ ] Both behind cone NAT → rendezvous + punch succeeds, no relay
- [ ] UDP blocked → TCP/443 carrier syncs
- [ ] Relay flips a byte → peer rejects the packet
- [ ] Sneakernet import of a command payload → rejected
- [ ] Resource key never appears in plaintext on the wire or in a log