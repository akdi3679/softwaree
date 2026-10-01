# ADR-020: Discovery Service — We Know IPs, Never Data

## Status
Accepted, 2026-08-22 (refines ADR-017, ADR-018, ADR-019)

## Context

The user clarified the architecture with a refined flow:

1. Each device has a stable **virtual IP** (10.50.0.x) — its identity
2. Devices talk to each other directly via a **private encrypted tunnel** (WireGuard)
3. We (the platform owner) run a **discovery service** that:
   - Knows the real public IP of each device
   - Receives heartbeats ("I'm at IP Y")
   - Provides lookups ("where is device with virtual IP 10.50.0.2?")
4. **The data path is always direct between devices** (LAN, internet, customer relay)
5. **We never see or relay data** — only the IP metadata

This is a "phone book" model: like a phone company, we know your number
and where you are, but we don't listen to your calls.

## The exact flow (admin wants to talk to user)

```
┌──────────────────────────────────────────────────────────┐
│ Step 1: Admin registers its own current IP              │
│                                                           │
│   Admin ──► Discovery: "I'm device 10.50.0.1             │
│                          currently at 41.200.50.10:51820 │
│                          state: internet (not LAN)       │
│                          last seen: now"                  │
│                                                           │
│   Discovery stores this. Heartbeat every 60s.            │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│ Step 2: Admin tries to reach User (10.50.0.2)            │
│                                                           │
│   a) Try LAN first (mDNS)                                │
│      - Broadcast "is 10.50.0.2 here?"                    │
│      - If yes: connect directly (zero config)            │
│      - If no: continue                                   │
│                                                           │
│   b) Try direct internet                                 │
│      - Use cached last-known public IP                   │
│      - If works: connect                                  │
│      - If fails: continue                                 │
│                                                           │
│   c) Ask discovery                                        │
│      - "Where is 10.50.0.2?"                              │
│      - Discovery: "10.50.0.2 is at 92.50.100.5:51820     │
│                    last seen 2 min ago, state: internet"  │
│      - Or: "10.50.0.2 not seen in 30 min, state: offline"│
│                                                           │
│   d) Try the IP discovery gave                            │
│      - If works: connect                                  │
│      - If fails: mark as offline (the IP is stale)       │
└──────────────────────────────────────────────────────────┘
```

**Important**: LAN is always tried first, both BEFORE and AFTER asking
discovery. Discovery helps with cross-network only.

## What we store in discovery

```sql
CREATE TABLE device_discovery (
  device_id        TEXT PRIMARY KEY,    -- e.g., dev_<base32>
  virtual_ip       TEXT NOT NULL,       -- 10.50.0.x
  account_id       TEXT NOT NULL,       -- who owns this device
  project_id       TEXT,                -- if joined to a project

  -- Last known location
  public_ip        TEXT,                -- e.g., 41.200.50.10
  public_port      INTEGER,             -- e.g., 51820
  ipv6_address     TEXT,                -- e.g., 2001:db8::1

  -- Reachability state
  state            TEXT,                -- 'lan', 'internet', 'offline', 'unknown'
  reachable_methods TEXT[],            -- ['mdns', 'direct_v4', 'direct_v6', 'relay']

  -- Timestamps
  last_heartbeat   TIMESTAMPTZ,
  first_seen       TIMESTAMPTZ,

  -- Privacy
  opt_out          BOOLEAN DEFAULT FALSE  -- if true, no metadata stored
);

CREATE INDEX ON device_discovery (virtual_ip);
CREATE INDEX ON device_discovery (account_id);
CREATE INDEX ON device_discovery (last_heartbeat);
```

## What we DON'T store

❌ Message contents
❌ Sync traffic
❌ Encryption keys (we never see them)
❌ User's actual data (patient names, lab results, etc.)
❌ Who is talking to whom (we only see heartbeats, not "A → B" logs)
❌ Connection durations (heartbeat says "I'm here", not "I just talked to X")

## Discovery endpoints (in our Cloud)

```
POST /v1/discovery/heartbeat
  Body: { device_id, virtual_ip, public_ip, public_port, ipv6?, state, reachable_methods }
  Auth: signed with device private key
  Rate: 1 per minute per device
  Storage: updates the row

GET /v1/discovery/lookup?virtual_ip=10.50.0.2
  Auth: signed with requesting device's private key
  Returns: { virtual_ip, public_ip, public_port, state, last_heartbeat }
  OR 404 if not seen in 30 min
  OR "no public IP" if device opted out

POST /v1/discovery/opt-out
  Body: { device_id }
  Auth: signed with device private key
  Effect: we forget this device's IP
  Note: device must use LAN or customer relay instead
```

## How the data flows (the important part)

```
Device A (Admin)         Device B (User)
    │                        │
    │   ┌─ Direct LAN ───┐   │
    │   │ mDNS + WireGuard│  │
    │   │                 │  │
    │   └─────────────────┘  │
    │                        │
    │   ┌─ Direct internet ─┐│
    │   │ WireGuard over IP ││
    │   │ (after asking us) ││
    │   └───────────────────┘│
    │                        │
    │  WE (discovery) ARE NOT IN THIS PATH
    │                        │
    │  We only know: "A is at 41.x, B is at 92.x"   │
    │  We don't know: "A sent a patient.create to B" │
    │  We don't see: the actual data                  │
```

The discovery service is a **directory**, not a **postman**.
Like DNS — DNS knows what IP a domain resolves to, but doesn't see the HTTP traffic.

## What devices tell us on heartbeat

```json
{
  "device_id": "dev_abc123",
  "virtual_ip": "10.50.0.1",
  "current_public_ip": "41.200.50.10",
  "current_public_port": 51820,
  "current_ipv6": "2001:db8::42",
  "state": "internet",
  "reachable_methods": ["direct_v4", "direct_v6"],
  "timestamp": "2026-08-22T12:00:00Z",
  "signature": "base64..."  // signed with device private key
}
```

That's it. No "I'm talking to X". No payload. No metadata about the conversation.

## What Admin asks us

```json
GET /v1/discovery/lookup?virtual_ip=10.50.0.2
Headers: X-Device-Id: dev_abc123
Headers: X-Signature: base64...

→ 200 OK
{
  "virtual_ip": "10.50.0.2",
  "current_public_ip": "92.50.100.5",
  "current_public_port": 51820,
  "state": "internet",
  "last_heartbeat": "2026-08-22T11:58:30Z",
  "reachable_methods": ["direct_v4"]
}
```

## Why this is the right trade-off

| What we know | What we don't know |
|---|---|
| Device exists | What data it has |
| Device's public IP | What it's sending |
| Last heartbeat time | To whom it's sending |
| Reachable methods | What the data says |
| LAN vs internet state | When it sends |

**Compared to Tailscale**:
- Tailscale: knows IPs + sometimes relays data via DERP
- Us: knows IPs, never relays data

**Compared to pure P2P (no discovery)**:
- Pure P2P: doesn't know IPs, but cross-network is hard
- Us: knows IPs, but cross-network is easy

**The user said**: "we as owner have ip of devices the real one"

This is the trade-off: we know IP metadata, not data. The user explicitly
accepts this in exchange for easy cross-network.

## Privacy controls (for the privacy-paranoid)

Customers can opt out of discovery:

- **Opt out**: we forget their IP, they must use LAN or customer relay
- **No discovery, no problem**: LAN mode + customer relay works fine
- **Selective opt-out**: opt out for some devices, not others

We make this opt-out prominent in the UI:
- "Send your current IP to our discovery service?"
- "Yes (recommended for easy remote access)"
- "No (you'll need to set up a relay or use LAN)"

## What changes from previous ADRs

- **ADR-019 (CGNAT detection)**: still applies, but discovery is the
  helper that remembers the IP
- **ADR-018 (stable IP)**: still applies, virtual IP is identity
- **ADR-017 (pure local)**: now refined — pure local for data, but
  we run discovery for IP metadata

## Implementation

### Backend (in `platform-cloud/`)

```
src/
  discovery/
    handlers.ts       # heartbeat, lookup, opt-out
    store.ts          # postgres queries
    auth.ts           # verify device signatures
    ratelimit.ts      # 1 heartbeat/min/device
    retention.ts      # auto-forget devices not seen in 7 days
    tests/
```

### Frontend (in `product/admin/`)

```
src/
  network/
    discovery_client.ts  # send heartbeats, query
    self_test.ts         # detect public IP, CGNAT, etc.
    connection_manager.ts # try LAN, direct, ask discovery, try
    reachability_ui.tsx   # show self-test results
    opt_out_ui.tsx        # privacy controls
```

## Tests

- [ ] Device heartbeats every 60s
- [ ] Lookup returns current IP
- [ ] Lookup returns 404 if device not seen in 30 min
- [ ] LAN attempt before internet
- [ ] Direct attempt before asking discovery
- [ ] Discovery response used to try again
- [ ] Offline detection when no path works
- [ ] Opt-out: device's IP forgotten
- [ ] Opt-out: device still works on LAN
- [ ] Heartbeat auth: rejected if not signed
- [ ] Rate limit: 1 heartbeat/min/device enforced
- [ ] Retention: device forgotten after 7 days of no heartbeat
- [ ] No content in heartbeat (just IP metadata)
- [ ] No content in lookup response (just IP metadata)
