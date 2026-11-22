# ADR-020: Discovery Service — We Know Endpoints, Never Data

**Status:** Accepted — amended 2026-11-22
**Date:** 2026-08-22 (refines ADR-017, ADR-018, ADR-019)
**Amended:** 2026-11-22 — the stored UDP endpoint is **probe-observed**, not self-reported; STUN mapping validity limited to endpoint-independent NAT; probe correlation token defined; lookup asymmetry stated in both directions; rendezvous columns renamed to UDP; `nat_behaviour` includes `none` (public IP); inbox long-poll endpoint added for punch signalling
**Deciders:** Architecture team
**See also:** ADR-017 (parent), ADR-018 (addressing), ADR-019 (self-test), ADR-024 (tunnel + relay), ADR-013 (owner console)

---

## Context

The refined flow the user asked for:

1. Each device has a stable **virtual address** inside its project namespace — its address, not its credential.
2. Devices talk **directly** over an encrypted tunnel.
3. We run a **discovery service** that learns each device's real public endpoint and answers lookups.
4. **The data path is always device-to-device** (LAN, direct, hole-punch, or relay).
5. We never see or relay readable data — only endpoint metadata.

This is a phone-book model: we know the number and roughly where you are; we do not listen to the call.

---

## The exact flow

```text
┌──────────────────────────────────────────────────────────────┐
│ Step 1 — each device publishes its endpoint                  │
│                                                              │
│   Device learns its mapped UDP port from STUN on the         │
│   WireGuard socket (not from the HTTPS heartbeat).           │
│                                                              │
│   Device ──► Discovery: POST /v1/discovery/heartbeat          │
│     { device_id, project_id, virtual_ip, udp_port_claim,     │
│       ipv6?, state, nat_behaviour, reachable_methods,        │
│       timestamp, nonce, sig }                                │
│                                                              │
│   Discovery takes public_ip from the OBSERVED packet source. │
│   The claimed UDP port is a CLAIM. The probe service sends   │
│   a UDP challenge; the device echoes on the WireGuard        │
│   socket; the probe OBSERVES the echo's source IP:port and   │
│   stores that observed pair. No echo → no endpoint stored.   │
│   Every 60 s.                                                │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 2 — a device wants to reach (proj_a1b2c3, 10.50.0.1)    │
│   (by default a User dialling the Admin)                     │
│                                                              │
│   a) LAN first (mDNS, device-key fingerprint)                │
│   b) Cached direct endpoint                                  │
│   c) Discovery lookup (project-scoped, signed, nonce)        │
│   d) Try the returned endpoint                               │
│   e) Hole-punch via /v1/discovery/punch (rendezvous + poll)  │
│      — only offered when nat_behaviour permits it            │
│      — target learns of the request via GET /inbox    │
│   f) Relay (customer-hosted or opt-in blind relay)           │
│   g) None worked → peer offline                              │
│                                                              │
│   Lookup asymmetry:                                          │
│     User  → may look up ONLY the Admin (10.50.0.1)           │
│     Admin → may look up ANY member of its project            │
└──────────────────────────────────────────────────────────────┘
```

**LAN is always tried first, before and after asking discovery.** Discovery helps with cross-network only.

---

## What we store

```sql
CREATE TABLE device_discovery (
  device_id         TEXT NOT NULL,           -- dev_<base32>
  project_id        TEXT NOT NULL,           -- namespace owner
  virtual_ip        TEXT NOT NULL,           -- 10.50.0.x within the project
  account_id        TEXT NOT NULL,

  -- Last known location. BOTH fields are OBSERVED, never trusted as reported.
  public_ip         TEXT,                    -- source IP of the last heartbeat
  udp_port          INTEGER,                 -- source port of the probe echo
  udp_port_claim    INTEGER,                 -- what the device claimed (diagnostic only)
  endpoint_verified_at TIMESTAMPTZ,          -- when the probe last observed an echo
  ipv6_address      TEXT,

  -- Reachability
  state             TEXT,                    -- 'lan' | 'internet' | 'offline' | 'unknown'
  nat_behaviour     TEXT,                    -- 'none' | 'cone' | 'symmetric' | 'unknown'
  reachable_methods TEXT[],                  -- ['mdns','direct_v4','direct_v6','punch','relay','tcp443']

  -- Timestamps
  last_heartbeat    TIMESTAMPTZ,
  first_seen        TIMESTAMPTZ,

  -- Privacy
  opt_out           BOOLEAN DEFAULT FALSE,

  PRIMARY KEY (device_id, project_id)
);

CREATE UNIQUE INDEX ON device_discovery (project_id, virtual_ip);
CREATE INDEX ON device_discovery (account_id);
CREATE INDEX ON device_discovery (last_heartbeat);
```

`(project_id, virtual_ip)` is unique because the same virtual address exists in every project namespace. A bare-IP index would be ambiguous and is never used for lookups.

`udp_port_claim` is retained for support diagnostics only. **It is never returned in a lookup response and never used to address a peer.**

### Punch rendezvous (short-lived table)

```sql
CREATE TABLE discovery_rendezvous (
  rendezvous_id      TEXT PRIMARY KEY,        -- random 16 bytes, base32
  project_id         TEXT NOT NULL,
  requester_device   TEXT NOT NULL,
  target_device      TEXT NOT NULL,
  requester_ip       TEXT,
  requester_udp_port INTEGER,
  target_ip          TEXT,
  target_udp_port    INTEGER,
  created_at         TIMESTAMPTZ NOT NULL,
  expires_at         TIMESTAMPTZ NOT NULL,    -- created_at + 30s
  punched_at         TIMESTAMPTZ
);
-- Deleted on success or expiry.
```

### Lookup audit (separate table)

```sql
CREATE TABLE discovery_lookup_log (
  at            TIMESTAMPTZ NOT NULL,
  requester     TEXT NOT NULL,     -- device_id
  target        TEXT NOT NULL,     -- device_id
  project_id    TEXT NOT NULL,
  source_ip     TEXT NOT NULL,
  outcome       TEXT NOT NULL      -- 'ok' | 'not_found' | 'opted_out' | 'forbidden'
);
-- Retained 30 days for security investigation, then deleted.
```

---

## What we do NOT store — and the honest limit

Never stored:

- ❌ Message contents or payloads
- ❌ Sync traffic
- ❌ Encryption keys (we never hold device private keys)
- ❌ Business data (patient names, lab results, invoices…)
- ❌ Connection durations
- ❌ Message-level "who talked to whom" logs

**The honest limit:** a signed lookup **does** reveal that *device A asked about device B at time T*. We log that because it is a security signal, and we scope it to a single project. We therefore **do not claim zero knowledge of contact intent**. We claim: no contents, no payloads, no durations, no business data — and lookups are visible to the customer in their own access log.

---

## The UDP port problem and solution

**Problem.** The heartbeat is HTTPS over TCP. The TCP source port says nothing about the UDP port WireGuard uses. Storing the TCP source port would make hole-punching fail silently.

**Solution — the endpoint stays observed, not self-reported:**

1. The device runs STUN on the **WireGuard UDP socket** (not a separate socket) and learns its mapped UDP port.
2. The device sends that value as `udp_port_claim` in the heartbeat. It is a **claim**, used only to address the challenge.
3. The probe service sends a UDP challenge to `(observed public_ip, udp_port_claim)`.
4. The device **echoes the challenge back on the WireGuard socket**.
5. The probe **observes the source IP:port of the echo** and stores that observed pair, with `endpoint_verified_at`.
6. If no echo arrives, **no endpoint is stored**, and `reachable_methods` omits `direct_v4` and `punch`.

The probe cannot see whether a packet "arrived" — only the device can. Observing the echo's source is what preserves the original invariant: **the stored endpoint is observed, never trusted as reported.**

**Correlation.** The STUN query stays anonymous (ADR-019): no account, device or project identifier. The probe challenge carries a **short-lived, single-use token issued in the heartbeat response**, so the echo is bound to the device that made the claim without putting an identifier in the STUN query.

**NAT caveat, stated honestly.** A STUN-derived mapping is the mapping toward *our STUN server*. It is reusable toward a peer **only when the NAT uses endpoint-independent mapping (cone)**. With endpoint-dependent (symmetric) mapping the published endpoint is not valid for a peer, hole-punch fails, and we fall through to a relay (ADR-019, ADR-024).

Therefore `nat_behaviour` **gates** the endpoint's use:

| `nat_behaviour` | Direct connect to the published endpoint | Hole-punch |
|---|---|---|
| `none` (public IP, no NAT; confirmed by the probe) | yes | not needed |
| `cone` (endpoint-independent mapping) | yes | yes |
| `symmetric` | **no** — the STUN mapping is valid only toward our STUN server | **no** → relay |
| `unknown` | try once | attempt once, then relay |

**Lookup asymmetry.** A **User may look up only the Admin** (`10.50.0.1`). The **Admin may look up any member of its project.** This is not "only Admin lookups are allowed" — the Admin→User direction is required by the delivery flow (ADR-017). User→User lookups return 403 and are logged as `forbidden`.

---

## Endpoints

```text
POST /v1/discovery/heartbeat
Body: { device_id, project_id, virtual_ip, udp_port_claim, ipv6?,
        state, nat_behaviour, reachable_methods, timestamp, nonce }
Auth: Ed25519 signature over method + path + timestamp + nonce + body
Note: public_ip is taken from the OBSERVED packet source, never the body.
      udp_port_claim addresses a probe challenge; the stored udp_port is
      the OBSERVED source port of the echo.
200:  { probe_token, probe_expires_at, pending_punches: [rendezvous_id] }
      (probe_token single-use, short-lived; pending_punches lists rendezvous
       ids awaiting the target's participation)
Rate: 1 per minute per device
Effect: upsert the row; endpoint fields written only after probe verification

GET /v1/discovery/lookup?project_id=<pid>&virtual_ip=10.50.0.2
Auth: signed, with timestamp + nonce (replay-protected)
Scope: requester and target must be members of the SAME project → else 403
Asymmetry: a User may only request virtual_ip = 10.50.0.1 (the Admin).
           A User requesting any other address → 403.
           The Admin may request any member address.
200: { virtual_ip, public_ip, udp_port, ipv6?, state,
       nat_behaviour, reachable_methods, last_heartbeat,
       endpoint_verified_at }
404: not seen in 30 minutes (treat as offline)
200 with public_ip = null: the device opted out, or no verified endpoint
Effect: one row in discovery_lookup_log

POST /v1/discovery/punch
Body: { device_id, project_id, target_virtual_ip, timestamp, nonce }
Auth: signed; same-project scope + lookup asymmetry enforced
409: target opted out, offline > 30 min, or nat_behaviour = symmetric
     on both sides (punch would be futile — go straight to relay)
200: { rendezvous_id }
Rate: 6 punches per minute per device pair

GET /v1/discovery/punch/{rendezvous_id}
Auth: signed; only the two registered devices may read it
Effect: short-poll until both sides are registered
200: { peer_public_ip, peer_udp_port, punch_at }   (once both present)
204: not both present yet (poll again, backoff ≤ 2 s)
410: rendezvous expired
Rate: 60 polls per minute per rendezvous_id (POST /punch stays 6 per minute per device pair)

GET /v1/discovery/inbox            (long-poll, held ≤ 30 s, one outstanding per device)
Auth: signed, timestamp + nonce
200: { pending: [ { rendezvous_id, from_virtual_ip, expires_at } ] }
     returned as soon as another member of the same project calls POST /v1/discovery/punch targeting this device
204: nothing pending after the hold

POST /v1/discovery/opt-out
Body: { device_id, project_id }
Auth: signed
Effect: erase stored endpoints, stop accepting heartbeats for this device
Note: the device must then use LAN, manual/QR endpoints, or a relay
```

Replay protection: the timestamp must be within **±60 s** of server time; each nonce is remembered for **5 minutes** and rejected on reuse. `probe_token` is single-use and expires with the heartbeat window.

Blind-relay session allocation is a separate endpoint defined in ADR-024 (`POST /v1/relay/session`), not part of discovery.

**A device that is likely to be a punch target (the Admin) keeps one inbox long-poll open while online.** Users connect to the Admin by default (User → Admin); the Admin pushes events over that same session, so it rarely needs to initiate. The rendezvous record lives 30 s, so the target must join inside that window.

---

## What a device tells us

```json
{
  "device_id": "dev_abc123",
  "project_id": "proj_a1b2c3",
  "virtual_ip": "10.50.0.1",
  "udp_port_claim": 51820,
  "ipv6": "2001:db8::42",
  "state": "internet",
  "nat_behaviour": "cone",
  "reachable_methods": ["direct_v4", "direct_v6", "punch"],
  "timestamp": "2026-11-20T12:00:00Z",
  "nonce": "8f3a1c...",
  "signature": "base64..."
}
```

No `public_ip` field: we read it from the packet. The UDP port is a claim until the probe observes the echo. No "I am talking to X". No payload. No conversation metadata.

## What the Admin asks us

```text
GET /v1/discovery/lookup?project_id=proj_a1b2c3&virtual_ip=10.50.0.2
X-Device-Id:  dev_abc123
X-Timestamp:  2026-11-20T12:00:00Z
X-Nonce:      8f3a1c...
X-Signature:  base64...   (signs method + path + timestamp + nonce)

→ 200 OK
{
  "virtual_ip": "10.50.0.2",
  "public_ip": "92.50.100.5",
  "udp_port": 51820,
  "state": "internet",
  "nat_behaviour": "cone",
  "reachable_methods": ["direct_v4", "punch"],
  "last_heartbeat": "2026-11-20T11:58:30Z",
  "endpoint_verified_at": "2026-11-20T11:58:31Z"
}
```

**If the requester is a User and asks for anything other than `10.50.0.1`, the response is 403 Forbidden.** Users can only discover the Admin. The Admin faces no such restriction within its own project.

---

## How the data flows

```text
Device A (Admin)                    Device B (User)
      │                                   │
      │   LAN: mDNS + WireGuard           │
      │ ◄───────────────────────────────► │
      │                                   │
      │   Direct / punched: WireGuard     │
      │ ◄───────────────────────────────► │
      │                                   │
      │   Relay (opt-in): ciphertext      │
      │ ◄──────────► [relay] ◄──────────► │
      │                                   │

Discovery is NOT in any of these paths.
We know: "A is at 41.x:51820, B is at 92.x:51820", and "A asked about B".
We never see: the tunnel contents, or that A sent patient.create to B.
```

Discovery is a **directory**, not a **postman**. Like DNS: it knows what a name resolves to, not what the HTTP request said. A blind relay is a **pipe**, not a reader: WireGuard authenticates peers by public key, so a malicious relay can drop packets but cannot read or forge them.

---

## Why this is the right trade-off

| What we know | What we don't know |
|---|---|
| A device exists | What data it holds |
| Its observed public endpoint (IP + probe-observed UDP port) | What it sends |
| Last heartbeat time and last endpoint verification | Connection contents or duration |
| Reachability methods and NAT behaviour | What the messages say |
| Lookup intent (A asked about B, same project) | Anything about the conversation |

- **vs Tailscale:** they know endpoints and may relay readable-transport traffic via DERP; our relay is opt-in and blind.
- **vs pure P2P with no discovery:** cross-network setup is manual and fragile; we make it automatic.

The user said: *"we as owner have ip of devices the real one."* That is the trade: endpoint metadata, never data — and we state the lookup-intent limit rather than hiding it.

---

## Privacy controls

- **Opt out** per device or per project: we erase the stored endpoint and stop accepting heartbeats. LAN, manual/QR, hole-punch by manual exchange, and relays still work.
- **Prominent UI choice**, before any heartbeat is sent:
  - "Send your current endpoint to our discovery service?"
  - "Yes — recommended, makes remote access automatic."
  - "No — you will need LAN, manual pairing, or a relay."
- **Customer-visible access log:** the Admin can see which lookups involved its devices.
- **Retention:** endpoints of devices not seen for **7 days** are erased. Lookup logs are kept **30 days**. Rendezvous records are deleted on success or expiry. Probe tokens expire with the heartbeat window.

---

## What changes from previous ADRs

- **ADR-017 (pure local):** refined — pure local for data; discovery exists for endpoint metadata and punch coordination.
- **ADR-018 (stable addressing):** unchanged — the virtual address is a per-project address; the pubkey is the identity.
- **ADR-019 (self-test):** refined — the STUN query stays anonymous; the mapped port it discovers is a claim until the probe observes an echo. NAT behaviour now gates whether the endpoint is offered for punching.
- **ADR-024 (userspace tunnel):** the tunnel runs in-app; discovery coordinates hole-punching; the blind relay is the opt-in last resort. Punch responses carry `peer_udp_port`.

---

## Implementation

**Backend (`platform-cloud/`)**

```text
src/discovery/
  handlers.ts        # heartbeat, lookup, punch, inbox, opt-out
  store.ts           # postgres queries (project-scoped)
  auth.ts            # device signature, timestamp window, nonce cache
  ratelimit.ts       # 1 heartbeat/min/device; 6 punches/min/pair; 60 polls/min/rendezvous
  retention.ts       # 7-day endpoint expiry, 30-day lookup-log expiry
  audit.ts           # discovery_lookup_log
  probe.ts           # UDP challenge + echo observation; stores observed source
  acl.ts             # same-project scope + User→Admin-only asymmetry
  tests/
```

**Client (`product/apps/*/src/network/`)**

```text
  discovery_client.ts    # heartbeat, lookup, punch, inbox, opt-out
  self_test.ts           # ADR-019
  stun_client.ts         # STUN on the WireGuard socket → udp_port_claim
  probe_responder.ts     # echoes the probe challenge on the WireGuard socket
  connection_manager.ts  # the path ladder (ADR-017)
  reachability_ui.tsx    # self-test results
  opt_out_ui.tsx         # privacy controls + access log
```

---

## Enforcement

- Every endpoint requires a valid device signature, a fresh timestamp and an unused nonce.
- Every lookup and punch verifies **same-project membership** against the Cloud registry before returning anything.
- **A User may only look up the Admin (`10.50.0.1`).** Any other target returns 403 and is logged as `forbidden`. The Admin may look up any member.
- `public_ip` is always written from the observed packet source. **Lint: no handler reads a client-supplied public IP.**
- `udp_port` is always written from the **observed source of the probe echo**. **Lint: no handler writes `udp_port` from `udp_port_claim`.** The claim is diagnostic only and never appears in a lookup response.
- No endpoint is stored without a successful probe verification.
- `nat_behaviour = symmetric` on both sides → punch returns 409; the client goes to relay without retrying.
- No response body may contain anything beyond the fields listed above.
- Opt-out erases endpoints synchronously and is confirmed to the device.
- The STUN query contains no account, device or project identifier; correlation happens via the single-use probe token.

### Tests

- [ ] Heartbeat every 60 s; rate limit enforced at 1/min/device
- [ ] Unsigned heartbeat → rejected
- [ ] Replayed nonce → rejected
- [ ] Timestamp outside ±60 s → rejected
- [ ] Self-reported `public_ip` in the body → ignored, observed IP stored
- [ ] Claimed `udp_port` differing from the echo's source port → **observed** port stored, claim retained for diagnostics only
- [ ] No probe echo → no endpoint stored, `direct_v4` and `punch` absent from `reachable_methods`
- [ ] Reused probe token → rejected
- [ ] Lookup returns the observed endpoint and `endpoint_verified_at`
- [ ] Lookup for a device unseen for 31 min → 404
- [ ] Cross-project lookup → 403, logged as `forbidden`
- [ ] **User lookup for another User → 403**
- [ ] **Admin lookup for a User → 200**
- [ ] `nat_behaviour = symmetric` both sides → punch 409, relay chosen, reason logged
- [ ] Opted-out target → `public_ip: null`, no endpoint leaked
- [ ] Punch registers a rendezvous and returns its id
- [ ] Short-poll returns 204 until both sides present, then 200 with `peer_udp_port`
- [ ] Rendezvous expires and is cleaned up
- [ ] Punch rate limit enforced per pair
- [ ] LAN attempted before internet, and again after discovery
- [ ] Opt-out erases the endpoint; device still works on LAN
- [ ] Endpoint erased after 7 days without heartbeats
- [ ] Lookup log erased after 30 days
- [ ] Lookup appears in the customer-visible access log
- [ ] STUN query contains no identifier
- [ ] No content in any heartbeat or lookup response
- [ ] Inbox long-poll returns 204 after 30 s with no pending punch
- [ ] Inbox long-poll returns 200 as soon as a punch targets this device
- [ ] Poll rate limit enforced at 60 polls/min/rendezvous_id