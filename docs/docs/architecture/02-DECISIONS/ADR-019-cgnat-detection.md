# ADR-019: Reachability Self-Test and Automatic Path Selection

**Status:** Accepted — amended 2026-11-20
**Date:** 2026-08-22 (refines ADR-017, ADR-018)
**Amended:** 2026-11-20 — unsourced statistics removed, self-hosted STUN, external probe replaces the broken self-connect test, hole-punch and blind relay added, discovery reconciled
**Deciders:** Architecture team
**See also:** ADR-017 (parent), ADR-018 (addressing), ADR-020 (discovery), ADR-024 (tunnel + relay)

---

## Context

We cannot assume any device has a reachable public endpoint:

- A large and growing share of connections sit behind **CGNAT**, varying heavily by country and ISP.
- Many devices have no reachable public IPv4 at all.
- Corporate networks are often restrictive: UDP blocked, proxy-only egress.
- IPv6 availability is uneven.

We deliberately **do not publish percentage figures** we have not measured. We instrument our own customer base at Phase 0 and let the numbers come from telemetry (opt-in), not from a guess.

The system must detect its own situation, pick a path automatically, and keep working when the Cloud is unreachable.

---

## Decision

Each device runs a **reachability self-test** on startup and periodically. The result is local metadata; only the endpoint portion is published to discovery, and only if the customer has not opted out.

### Self-test sequence (~5 seconds)

```
1. Inspect local interfaces
   - Enumerate IPv4 + IPv6 addresses and listening ports
   - Classify: private (10/8, 172.16/12, 192.168/16), CGNAT-range (100.64/10),
     link-local, global

2. Discover the public endpoint (STUN-style query)
   - Query OUR OWN STUN servers: stun1.<platform-domain>, stun2.<platform-domain>
     (self-hosted, in our infra — ADR-024)
   - Public STUN (e.g. Cloudflare) only as an explicit opt-in fallback
   - The response reveals: <observed public IP>:<observed source port>
   - Anonymous: no account, no device id, no project id in the query
   - Compare with local interfaces:
       match  → directly connected (public endpoint on-box)
       differ → behind NAT (router NAT or CGNAT)

3. Test INBOUND reachability with an EXTERNAL PROBE
   ⚠️ Connecting to my own public IP proves nothing: NAT hairpinning
      makes that test fail on most routers even when the device IS reachable.
   - Ask our probe service to send a UDP packet to the observed endpoint
   - Probe arrives  → reachable from outside
   - No probe       → not reachable (CGNAT, firewall, or UDP blocked)
   - Repeat with a TCP/443 probe to learn whether TCP fallback is needed

4. Check IPv6
   - Global IPv6 present? Can a peer reach it? (probe over IPv6)

5. Classify NAT behaviour
   - Endpoint-independent mapping (cone) → hole-punch likely to work
   - Endpoint-dependent mapping (symmetric) → hole-punch unlikely; relay needed

6. Record the result locally
   - "I can be reached at X via methods [Y]"
   - Published to discovery only if the customer has discovery enabled
```

### Path selection (automatic)

| Self-test result | Selected path |
|---|---|
| Same LAN as peer (mDNS) | LAN — mDNS + WireGuard |
| Reachable public IPv4 | Direct WireGuard over IPv4 |
| Reachable global IPv6 | Direct WireGuard over IPv6 |
| Behind NAT, peer reachable | Outbound to the peer |
| Both behind NAT, cone NAT | **Discovery-coordinated UDP hole-punch** |
| Both behind filtering CGNAT / symmetric NAT | **Relay** — customer-hosted, or our opt-in blind relay |
| UDP blocked | Same paths over **TCP/443** |
| No connectivity at all | **Sneakernet** — read-only snapshot export/import |

**Why "outbound to the peer" works:** NAT allows outbound traffic and remembers the mapping. Once the Admin sends to a reachable User endpoint, replies flow back. NAT mappings expire — typically tens of seconds to a few minutes — which is exactly why the **WireGuard keep-alive is 25 seconds** (ADR-018). This is the same technique WebRTC and BitTorrent use.

**Why hole-punching is attempted before any relay:** with endpoint-independent mapping on at least one side, simultaneous sends create the mappings both ways and the tunnel comes up direct. With symmetric NAT on both sides it usually fails, and we fall through to a relay without pretending otherwise.

---

## How devices find each other

**On LAN:** mDNS **service discovery** using a pure-Rust library (works on Windows, macOS and Linux — Avahi does not exist on Windows). We resolve **service names carrying the device-key fingerprint**, not bare IPs, because mDNS resolves names and services, not addresses. Zero configuration.

**Cross-network, direct endpoint:** discovery lookup is the default (ADR-020). Fallbacks, all offline-capable:
- Cached last-known endpoint
- QR code shown by the Admin
- Manually typed endpoint
- Out-of-band exchange (the customer messages themselves the endpoint)

**Both behind CGNAT:** hole-punch first; then the customer's own relay (a small VM that sees only WireGuard ciphertext) **or our opt-in blind relay** (ADR-024), which is the realistic option for a clinic that will never run a VM. TCP/443 where UDP is blocked.

**No relay in the default path.** Direct and punch are always tried first. The blind relay is opt-in, forwards only ciphertext, and is disclosed in plain language before it is enabled.

---

## Continuous re-evaluation

The self-test runs:
- On startup
- Every 5 minutes
- On any path failure
- On an OS network-change event
- On user request ("Test my connection")

If a better path appears, the app switches automatically and transparently — relay → direct when a user moves to a network with a reachable endpoint, direct → LAN when both devices land on the same Wi-Fi. The application layer never notices.

---

## Why this is better than a third-party coordination service — stated honestly

A commercial coordination service typically knows every device's endpoint, reachability, connection attempts, and — when it relays — the traffic itself.

We know less, and we are precise about what we do know:

| We know | We never know |
|---|---|
| A device's observed public endpoint | Message contents or payloads |
| Heartbeat time and reachability methods | Connection durations |
| That device A asked about device B (same project) | What was said between them |

Path selection happens **locally on the device**. Discovery is a helper outside the data path, and the mesh works without it (LAN, cached endpoint, QR, manual, relay). ADR-020 states the lookup-intent limit explicitly rather than claiming zero knowledge.

**Trade-off:** cross-network setup is easier with discovery enabled. Customers who disable it retain LAN, manual/QR pairing, hole-punch by manual endpoint exchange, and relays. We mitigate with:
- Zero-config LAN (the common case)
- One-toggle blind relay for filtering CGNAT
- A one-line script for a customer-hosted relay
- Read-only sneakernet for air-gapped sites
- A clear, friendly self-test UI

---

## What we don't do

- ❌ Run a coordination server **in the data path** (discovery is metadata-only)
- ❌ Put a relay in the default path (the blind relay is opt-in)
- ❌ Store endpoints centrally without consent (discovery is opt-out, prominently)
- ❌ Track connection contents or durations
- ❌ Use third-party STUN by default (we run our own)
- ❌ Log anything from STUN queries (they are anonymous reachability probes)
- ❌ Claim a self-connect test proves inbound reachability

---

## Enforcement

- The self-test is the only producer of reachability state; the path selector is its only consumer.
- The inbound test **must** use the external probe. Lint: no code connects to its own observed public endpoint as a reachability check.
- STUN and probe endpoints are our own by default; a third-party endpoint requires an explicit opt-in flag.
- No percentage or market-share claim appears in docs or UI without a cited measurement.
- NAT-behaviour classification is recorded so support can explain why a relay was chosen.

### Tests
- [ ] Device behind router NAT → classified correctly, outbound path chosen
- [ ] Device behind CGNAT → probe fails, relay path offered
- [ ] Hairpinning router: self-connect would fail, external probe succeeds → correct classification
- [ ] Cone NAT on both sides → hole-punch succeeds, no relay used
- [ ] Symmetric NAT on both sides → punch fails, relay chosen, reason logged
- [ ] UDP blocked → TCP/443 probe succeeds and the tunnel uses it
- [ ] Discovery disabled → LAN and manual pairing still work
- [ ] Network change event → self-test re-runs and the path upgrades automatically
- [ ] STUN query contains no account, device or project identifier