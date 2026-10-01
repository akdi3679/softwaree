# ADR-017: Pure Local Mesh — No Third-Party VPN in the Data Path

**Status:** Accepted
**Date:** 2026-08-22
**Deciders:** Architecture team

> This ADR was the original decision that the pure local mesh was chosen over Tailscale/Headscale. It is referenced by ADR-018 (stable IP), ADR-019 (CGNAT detection), and ADR-020 (discovery service) as the parent decision.

---

## Context

The user requirement is explicit:

> *"by some techniques, but without any company or other server in the format"*

> *"this cnnect is first tryed by lan then by internet before and after ask discovery systeme  it always lan first then internet"*

> *"so we as owner have ip of devices the real one , each device if its accessing ip change it tell the discovery"*

> *"then users and admin talk between them by  ip they know if not reachable from lan first then internet they askdicoverry for help"*

The user wants:
- **No third-party VPN** in the data path.
- **Devices as servers**, with stable virtual IPs, talking directly.
- **Discovery service** that knows IPs (not data) — owned by us, the platform owner.
- **LAN first, then internet, then discovery fallback.**

Tailscale is excellent technology, but it puts Tailscale (a company) in the data path. The user explicitly does not want this.

This ADR supersedes ADR-003 (Tailscale + Headscale) as the active networking model. ADR-003 is kept for historical context only.

## Decision

We **do not use Tailscale, our mesh, ZeroTier, Nebula, or any third-party VPN** in the data path. We implement our own minimal mesh with the following layers:

1. **Identity**: Ed25519 keypair per device, generated locally, never sent to any third party.
2. **Stable virtual IP**: Assigned from a private range we own (`10.50.0.0/16`). The Admin is always `10.50.0.1`, Users are `10.50.0.2`, `10.50.0.3`, etc. Per project.
3. **Encrypted tunnel**: WireGuard protocol (RFC). We implement the protocol ourselves (or use a Rust crate), no third-party client. WireGuard is a **protocol**, not a company.
4. **Discovery**: Our Cloud runs a small discovery service that knows the public IP of each device (via heartbeats) and provides lookups. The discovery service is **not in the data path** — it only answers "where is virtual IP X?"
5. **Path selection**: LAN first (mDNS), then direct internet (cached last-known IP), then discovery lookup, then customer relay (if both sides are behind CGNAT).

The mesh is **our implementation**. We do not depend on our WireGuard mesh, ZeroTier, Nebula, or any other third-party mesh.

## What Stays, What Changes from ADR-003

| Aspect | ADR-003 (Tailscale) | ADR-017 (Pure local) |
|---|---|---|
| Mesh technology | Tailscale client + Headscale control | Our own WireGuard-based mesh |
| Coordination server | our discovery service (in our Cloud) | Our discovery service (in the Cloud) |
| Identity | Tailscale-issued | Ed25519 keypair, generated locally |
| Virtual IPs | `100.x.y.z` (Tailscale's range) | `10.50.0.0/16` (our own range) |
| NAT traversal | Tailscale's DERP relays | Customer relay (or direct, or sneakernet) |
| ACLs | Headscale ACLs | Our own ACLs (in the Admin + Cloud) |
| Cost | Per-device fees (if Tailscale's hosted) | $0 (no third-party fees) |
| Privacy | Tailscale sees metadata (or relays data) | We see only IP metadata (never data) |
| Open source | Headscale is open source | Our mesh is open source (we publish the protocol spec) |
| Cross-platform | Tailscale clients for all OSes | We implement the client in our Admin/User apps (Rust + WireGuard) |

## Why This Is Better for the User's Vision

| Concern | Tailscale | Pure local |
|---|---|---|
| Third-party in data path | Yes (Tailscale's coordination, optionally DERP) | No (only our discovery, which sees no data) |
| User trust | "We use Tailscale, trust them" | "We built it, you can read the code" |
| Cost | $5/user/month at scale | $0 (we already run the Cloud) |
| Vendor lock-in | Migration off Tailscale is a major project | Migration off our own code is a refactor |
| Customization | Limited (we'd need to fork Tailscale) | Full (it's our code) |

## The Discovery Flow (Operational)

When the Admin wants to talk to a User at virtual IP `10.50.0.2`:

```
1. Try LAN (mDNS broadcast for "10.50.0.2")
   - If found: connect via WireGuard over LAN
   - If not: continue

2. Try direct internet (cached last-known public IP)
   - If successful: connect, cache the IP
   - If failed: continue

3. Ask discovery: "where is 10.50.0.2?"
   - Discovery: returns current public IP + state
   - OR: "not seen in 30 min, offline"
   - OR: "no public IP" (device opted out)

4. Try the IP discovery returned
   - If works: connect, cache the IP
   - If fails: mark as offline

Important: LAN is always tried first, BOTH before and after asking discovery.
Discovery helps with cross-network only.
```

## What We Don't Build (in v1)

- **Our own relay server.** We don't run a relay by default. Customer runs a customer relay (small VM with WireGuard) if needed.
- **A hosted DERP-like fallback.** Customers behind CGNAT on both sides must use a customer relay.

## See also

- ADR-003: Tailscale + Headscale (SUPERSEDED)
- ADR-018: Stable IP Mesh — Identity and Routing
- ADR-019: CGNAT Detection + Automatic Path Selection
- ADR-020: Discovery Service — We Know IPs, Never Data
