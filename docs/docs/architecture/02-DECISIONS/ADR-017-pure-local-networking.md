# ADR-017: Pure Local Mesh — No Third-Party VPN in the Data Path

**Status:** Accepted — amended 2026-11-20
**Date:** 2026-08-22
**Amended:** 2026-11-20 — search/replace damage repaired, userspace tunnel, hole-punching and opt-in blind relay added to the path ladder, comparison table corrected
**Deciders:** Architecture team
**See also:** ADR-003 (superseded), ADR-018 (stable addressing), ADR-019 (self-test), ADR-020 (discovery), ADR-024 (userspace tunnel + relay), ADR-013 (our own ops VPN)

> This is the parent networking decision. ADR-018, ADR-019, ADR-020 and ADR-024 refine it.

---

## Context

The user requirement is explicit:

> *"by some techniques, but without any company or other server in the format"*
> *"this cnnect is first tryed by lan then by internet before and after ask discovery systeme — it always lan first then internet"*
> *"so we as owner have ip of devices the real one, each device if its accessing ip change it tell the discovery"*
> *"then users and admin talk between them by ip they know if not reachable from lan first then internet they ask dicoverry for help"*

The user wants:
- **No third-party VPN** in the data path.
- **Devices as servers**, with stable virtual addresses, talking directly.
- A **discovery service** that knows IPs, never data — owned by us.
- **LAN first, then internet, then discovery as a helper.**

Tailscale is excellent technology, but it places a company in the coordination path and optionally in the data path (DERP). The user explicitly does not want that. This ADR supersedes ADR-003.

---

## Decision

We **do not use Tailscale, Headscale, ZeroTier, Nebula, or any third-party VPN** in the data path. We implement our own minimal mesh in five layers:

1. **Identity.** An Ed25519 keypair per device, generated locally. The private key never leaves the device. A second X25519 keypair handles key wrapping (ADR-007, ADR-010).

2. **Stable virtual addressing.** Addresses come from `10.50.0.0/16`, allocated **per project**: the Admin is `10.50.0.1`, Users are `10.50.0.2`, `.3`, … An address is always resolved as the pair `(project_id, virtual_ip)` — never a bare IP (ADR-018).

3. **Encrypted tunnel.** The WireGuard protocol, implemented **in userspace inside the app** (Rust: `boringtun` or equivalent, plus a small userspace network stack such as `smoltcp`). **No kernel driver, no system adapter, no administrator rights.** This is what makes the promise true on Windows, where our customers actually are (ADR-024). WireGuard is a **protocol**, not a company.

4. **Discovery.** Our Cloud runs a small service that learns each device's **observed** public endpoint via heartbeats and answers "where is `(project, virtual_ip)`?". It also coordinates UDP hole-punching. It is **not in the data path** (ADR-020).

5. **Path selection**, in this exact order:

```
LAN (mDNS)  →  cached direct endpoint  →  discovery lookup  →
discovery-coordinated UDP hole-punch  →  relay (customer-hosted, or our
opt-in BLIND relay)  →  offline
```

with a **TCP/443 fallback** wherever UDP is blocked. LAN is tried first **both before and after** asking discovery.

The mesh is **our implementation**. We depend on no third-party mesh, and no third-party client is installed on a customer machine.

---

## What stays, what changes from ADR-003

| Aspect | ADR-003 (Tailscale) | ADR-017 (pure local) |
|---|---|---|
| Mesh technology | Tailscale client + Headscale control | Our own userspace WireGuard mesh, in-app |
| Coordination server | Headscale (self-hosted Tailscale control) | Our discovery service — IP metadata only, never data |
| Identity | Tailscale-issued node keys | Ed25519 keypair generated locally |
| Virtual addresses | `100.x.y.z` (Tailscale's range) | `10.50.0.0/16`, **per-project namespace** |
| NAT traversal | Tailscale's DERP relays | Hole-punch first; blind relay or customer relay as fallback |
| ACLs | Headscale ACL file | Our own ACLs, enforced on the Admin (ADR-012) |
| Driver / admin rights | Required on Windows | **Not required** — userspace |
| Cost | Per-device fees on hosted plans | No third-party fees; we already run the Cloud |
| Privacy | Tailscale sees metadata, may relay data | We see IP metadata only; a blind relay sees ciphertext only |
| Open source | Headscale is open source | Our mesh is open source; we publish the protocol spec |
| Cross-platform | Separate client per OS | One implementation inside our Admin/User apps |

**What carries over from ADR-003:** device-key identity, LAN-first discovery, the rejection of IP rotation as a "security feature", and the separation of our team's operations network from the customer mesh. The ops network still exists — as our own staff VPN in ADR-013. A VPN for **our own team** is fine; it is not in the customer data path.

---

## Why this is better for the user's vision

| Concern | Tailscale | Pure local |
|---|---|---|
| Third party in the data path | Possible (DERP) | Never readable; blind relay forwards ciphertext only |
| Customer trust story | "Trust Tailscale" | "It is our code, and you can read it" |
| Install friction on Windows | Driver + admin rights | No driver, no admin rights |
| Address collisions with a real LAN | Possible | Harmless — addresses live inside the app's own stack |
| Vendor lock-in | Migration is a project | Migration is a refactor |
| Customisation | Fork required | It is our code |

---

## The discovery flow (operational)

When the Admin wants to reach a User at `(proj_a1b2c3, 10.50.0.2)`:

```
1. Try LAN (mDNS service lookup, keyed by the device-key fingerprint)
   - Found → connect over the LAN. Done.
   - Not found → continue
2. Try the cached direct endpoint (last successful public IP:port)
   - Works → connect, refresh the cache. Done.
   - Fails → continue
3. Ask discovery: "where is (proj_a1b2c3, 10.50.0.2)?"
   - 200 → observed public endpoint + state
   - 404 → not seen in 30 min (treat as offline)
   - "no public IP" → the device opted out
   - 403 → not the same project (never leaks across projects)
4. Try the endpoint discovery returned
   - Works → connect, cache it. Done.
   - Fails → continue
5. Ask discovery to coordinate a UDP hole-punch (/v1/discovery/punch)
   - Both sides send simultaneously to each other's observed endpoint
   - Works → connect. Done.
   - Fails (symmetric NAT / CGNAT that filters) → continue
6. Relay
   - Customer-hosted relay if configured, else our opt-in blind relay
   - TCP/443 transport if UDP is blocked
   - No relay available → mark the peer offline (ADMIN_UNKNOWN on the User)

LAN is always tried first, BEFORE and AFTER asking discovery.
Discovery helps with cross-network only.
```

---

## What we don't build (in v1)

- **A relay in the default path.** No relay is used unless direct and hole-punch paths have failed.
- **A relay that can read data.** Our opt-in blind relay forwards only WireGuard ciphertext it cannot decrypt (ADR-024). Customer-hosted relays remain supported — but we do not pretend a doctor will run a VM.
- **A kernel driver or system network adapter.** Userspace only.
- **A third-party coordination service.** Discovery is ours, and the mesh works without it.

---

## Honesty about metadata

We do not claim zero metadata. Discovery learns each device's observed public endpoint and heartbeat time, and a signed lookup reveals that **device A asked about device B** within a project. We never see message contents, payloads, connection durations, or business data. ADR-020 states this limit explicitly, and the UI discloses it before a customer enables discovery.

---

## Enforcement

- No third-party VPN client, driver, or system adapter is shipped or required. The installer is tested on Windows **without administrator rights**.
- The tunnel runs inside the app process; no OS route table is modified.
- Address resolution always takes `(project_id, virtual_ip)`. Lint: no lookup API accepts a bare virtual IP.
- The path ladder is implemented once, in one function, and every transport is attempted in the documented order.
- Discovery may be disabled entirely; LAN and manual/QR pairing must still work with it off.

### Tests
- [ ] Windows install and first sync with a standard (non-admin) user account
- [ ] Host LAN using `10.50.x.x` → mesh still works, no OS route changes
- [ ] Admin hosting two projects → no address ambiguity
- [ ] LAN path chosen when both devices share a network, with discovery disabled
- [ ] Discovery down → cached endpoint and LAN still work
- [ ] Both sides behind CGNAT → hole-punch attempted before any relay
- [ ] UDP blocked → TCP/443 fallback connects
- [ ] Blind relay observes ciphertext only; a tampered packet is rejected by WireGuard
- [ ] Cross-project lookup → 403

---

## See also
- ADR-003: Tailscale + Headscale (SUPERSEDED)
- ADR-018: Stable Addressing and Routing
- ADR-019: Reachability Self-Test and Path Selection
- ADR-020: Discovery Service — We Know IPs, Never Data
- ADR-024: Userspace Tunnel, Hole-Punching, and the Blind Relay
- ADR-013: Private Channel and Owner Console (our own ops VPN)