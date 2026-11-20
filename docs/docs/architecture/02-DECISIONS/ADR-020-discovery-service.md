# ADR-020: Discovery Service — We Know Endpoints, Never Data

**Status:** Accepted — amended 2026-11-20
**Date:** 2026-08-22 (refines ADR-017, ADR-018, ADR-019)
**Amended:** 2026-11-20 — project-scoped lookups, replay protection, observed source IP, honest metadata limits, hole-punch coordination (rendezvous + short-poll), corrected schema and examples
**Deciders:** Architecture team
**See also:** ADR-017 (parent), ADR-018 (addressing), ADR-019 (self-test), ADR-024 (tunnel + relay), ADR-013 (owner console)

---

## Context

The refined flow the user asked for:

1. Each device has a stable **virtual address** inside its project namespace — its address, not its credential.
2. Devices talk **directly** over an encrypted tunnel.
3. We run a **discovery service** that learns each device's real public endpoint from heartbeats and answers lookups.
4. **The data path is always device-to-device** (LAN, direct, hole-punch, or relay).
5. We never see or relay readable data — only endpoint metadata.

This is a phone-book model: we know the number and roughly where you are; we do not listen to the call.

---

## The exact flow

```
┌──────────────────────────────────────────────────────────────┐
│ Step 1 — each device publishes its endpoint                  │
│                                                              │
│   Device ──► Discovery: POST /v1/discovery/heartbeat          │
│     { device_id, project_id, virtual_ip, public_port,        │
│       ipv6?, state, reachable_methods, timestamp, nonce, sig }│
│                                                              │
│   Discovery records the OBSERVED source IP:port from the      │
│   packet, not a self-reported value. Every 60 s.             │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│ Step 2 — Admin wants to reach (proj_a1b2c3, 10.50.0.2)        │
│                                                              │
│   a) LAN first (mDNS, device-key fingerprint)                │
│   b) Cached direct endpoint                                  │
│   c) Discovery lookup (project-scoped, signed, nonce)        │
│   d) Try the returned endpoint                               │
│   e) Hole-punch via /v1/discovery/punch (rendezvous + poll)  │
│   f) Relay (customer-hosted or opt-in blind relay)           │
│   g) None worked → peer offline                              │
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

  -- Last known location (OBSERVED, not self-reported)
  public_ip         TEXT,                    -- source IP of the last heartbeat
  public_port       INTEGER,                 -- source port of the last heartbeat
  ipv6_address      TEXT,

  -- Reachability
  state             TEXT,                    -- 'lan' | 'internet' | 'offline' | 'unknown'
  nat_behaviour     TEXT,                    -- 'cone' | 'symmetric' | 'unknown'
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

### Punch rendezvous (short-lived table)

```sql
CREATE TABLE discovery_rendezvous (
  rendezvous_id     TEXT PRIMARY KEY,        -- random 16 bytes, base32
  project_id        TEXT NOT NULL,
  requester_device  TEXT NOT NULL,
  target_device     TEXT NOT NULL,
  requester_ip      TEXT,
  requester_port    INTEGER,
  target_ip         TEXT,
  target_port       INTEGER,
  created_at        TIMESTAMPTZ NOT NULL,
  expires_at        TIMESTAMPTZ NOT NULL,    -- created_at + 30s
  punched_at        TIMESTAMPTZ
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

**The honest limit:** a signed lookup **does** reveal that *device A asked about device B at time T*. We log that (above) because it is a security signal, and we scope it to a single project. We therefore **do not claim zero knowledge of contact intent**. We claim: no contents, no payloads, no durations, no business data — and lookups are visible to the customer in their own access log.

---

## Endpoints

```
POST /v1/discovery/heartbeat
  Body: { device_id, project_id, virtual_ip, public_port, ipv6?,
          state, nat_behaviour, reachable_methods, timestamp, nonce }
  Auth: Ed25519 signature over method + path + timestamp + nonce + body
  Note: public_ip is taken from the OBSERVED packet source, never the body
  Rate: 1 per minute per device
  Effect: upsert the row

GET /v1/discovery/lookup?project_id=<pid>&virtual_ip=10.50.0.2
  Auth: signed, with timestamp + nonce (replay-protected)
  Scope: requester and target must be members of the SAME project → else 403
  200: { virtual_ip, public_ip, public_port, ipv6?, state,
         nat_behaviour, reachable_methods, last_heartbeat }
  404: not seen in 30 minutes (treat as offline)
  200 with public_ip = null: the device opted out
  Effect: one row in discovery_lookup_log

POST /v1/discovery/punch
  Body: { device_id, project_id, target_virtual_ip, timestamp, nonce }
  Auth: signed; same-project scope enforced
  Effect: registers this device in a short-lived rendezvous record for the pair
  200: { rendezvous_id }
  409: target opted out or offline > 30 min
  Rate: 6 punches per minute per device pair

GET /v1/discovery/punch/{rendezvous_id}
  Auth: signed; only the two registered devices may read it
  Effect: short-poll until both sides are registered
  200: { peer_public_ip, peer_public_port, punch_at }   (once both present)
  204: not both present yet (poll again, backoff ≤ 2 s)
  410: rendezvous expired
  Rate: 6 punches per minute per device pair

POST /v1/discovery/opt-out
  Body: { device_id, project_id }
  Auth: signed
  Effect: erase stored endpoints, stop accepting heartbeats for this device
  Note: the device must then use LAN, manual/QR endpoints, or a relay
```

Replay protection: the timestamp must be within **±60 s** of server time; each nonce is remembered for **5 minutes** and rejected on reuse.

Blind-relay session allocation is a separate endpoint defined in ADR-024 (`POST /v1/relay/session`), not part of discovery.

---

## What a device tells us

```json
{
  "device_id": "dev_abc123",
  "project_id": "proj_a1b2c3",
  "virtual_ip": "10.50.0.1",
  "public_port": 51820,
  "ipv6": "2001:db8::42",
  "state": "internet",
  "nat_behaviour": "cone",
  "reachable_methods": ["direct_v4", "direct_v6", "punch"],
  "timestamp": "2026-11-20T12:00:00Z",
  "nonce": "8f3a1c...",
  "signature": "base64..."
}
```

No `public_ip` field: we read it from the packet. No "I am talking to X". No payload. No conversation metadata.

## What the Admin asks us

```
GET /v1/discovery/lookup?project_id=proj_a1b2c3&virtual_ip=10.50.0.2
X-Device-Id:  dev_abc123
X-Timestamp:  2026-11-20T12:00:00Z
X-Nonce:      8f3a1c...
X-Signature:  base64...   (signs method + path + timestamp + nonce)

→ 200 OK
{
  "virtual_ip": "10.50.0.2",
  "public_ip": "92.50.100.5",
  "public_port": 51820,
  "state": "internet",
  "nat_behaviour": "cone",
  "reachable_methods": ["direct_v4", "punch"],
  "last_heartbeat": "2026-11-20T11:58:30Z"
}
```

---

## How the data flows

```
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
  We know: "A is at 41.x, B is at 92.x", and "A asked about B".
  We never see: the tunnel contents, or that A sent patient.create to B.
```

Discovery is a **directory**, not a **postman**. Like DNS: it knows what a name resolves to, not what the HTTP request said. A blind relay is a **pipe**, not a reader: WireGuard authenticates peers by public key, so a malicious relay can drop packets but cannot read or forge them.

---

## Why this is the right trade-off

| What we know | What we don't know |
|---|---|
| A device exists | What data it holds |
| Its observed public endpoint | What it sends |
| Last heartbeat time | Connection contents or duration |
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
- **Retention:** endpoints of devices not seen for **7 days** are erased. Lookup logs are kept **30 days**. Rendezvous records are deleted on success or expiry.

---

## What changes from previous ADRs

- **ADR-017 (pure local):** refined — pure local for data; discovery exists for endpoint metadata and punch coordination.
- **ADR-018 (stable addressing):** unchanged — the virtual address is a per-project address; the pubkey is the identity.
- **ADR-019 (self-test):** unchanged — discovery stores what the self-test publishes, using the observed source address.
- **ADR-024 (userspace tunnel):** the tunnel runs in-app; discovery also coordinates hole-punching; the blind relay is the opt-in last resort.

---

## Implementation

**Backend (`platform-cloud/`)**
```
src/discovery/
  handlers.ts        # heartbeat, lookup, punch, opt-out
  store.ts           # postgres queries (project-scoped)
  auth.ts            # device signature, timestamp window, nonce cache
  ratelimit.ts       # 1 heartbeat/min/device; 6 punches/min/pair
  retention.ts       # 7-day endpoint expiry, 30-day lookup-log expiry
  audit.ts           # discovery_lookup_log
  tests/
```

**Client (`product/apps/*/src/network/`)**
```
discovery_client.ts    # heartbeat, lookup, punch, opt-out
self_test.ts           # ADR-019
connection_manager.ts  # the path ladder (ADR-017)
reachability_ui.tsx    # self-test results
opt_out_ui.tsx         # privacy controls + access log
```

---

## Enforcement

- Every endpoint requires a valid device signature, a fresh timestamp and an unused nonce.
- Every lookup and punch verifies **same-project membership** against the Cloud registry before returning anything.
- `public_ip` is always written from the observed packet source. Lint: no handler reads a client-supplied public IP.
- No response body may contain anything beyond the fields listed above.
- Opt-out erases endpoints synchronously and is confirmed to the device.

### Tests
- [ ] Heartbeat every 60 s; rate limit enforced at 1/min/device
- [ ] Unsigned heartbeat → rejected
- [ ] Replayed nonce → rejected
- [ ] Timestamp outside ±60 s → rejected
- [ ] Self-reported `public_ip` in the body → ignored, observed IP stored
- [ ] Lookup returns the current observed endpoint
- [ ] Lookup for a device unseen for 31 min → 404
- [ ] Cross-project lookup → 403, logged as `forbidden`
- [ ] Opted-out target → `public_ip: null`, no endpoint leaked
- [ ] Punch registers a rendezvous and returns its id
- [ ] Short-poll returns 204 until both sides present, then 200 with peer info
- [ ] Rendezvous expires and is cleaned up
- [ ] Punch rate limit enforced per pair
- [ ] LAN attempted before internet, and again after discovery
- [ ] Opt-out erases the endpoint; device still works on LAN
- [ ] Endpoint erased after 7 days without heartbeats
- [ ] Lookup log erased after 30 days
- [ ] Lookup appears in the customer-visible access log
- [ ] No content in any heartbeat or lookup response