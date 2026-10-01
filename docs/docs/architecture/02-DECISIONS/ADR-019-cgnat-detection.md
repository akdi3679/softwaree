# ADR-019: CGNAT Detection + Automatic Path Selection

## Status
Accepted, 2026-08-22 (refines ADR-017, ADR-018)

## Context

The reality of home / small business networks in 2026:
- ~60% of users are behind CGNAT (their ISP does NAT)
- ~25% have a public IP (often shared, sometimes static)
- ~10% are on corporate networks (very restrictive)
- ~5% have full IPv6

We cannot assume any device has a public IP. The system must:
1. Detect at startup what the device's situation is
2. Choose the right path automatically
3. Work without a central coordination server

This is exactly what Tailscale, ZeroTier, and other mesh VPNs do — but
they all use a central coordination server. We don't.

## Decision

Each device, on startup and periodically, runs a self-test:

### Self-test sequence (~5 seconds, runs on startup)

```
1. Check local interfaces
   - Get all IP addresses (IPv4 + IPv6)
   - Get all listening ports
   - Detect: am I on a private network? (10.x, 172.16-31.x, 192.168.x)

2. Check public reachability (anonymous STUN-like query)
   - Query multiple STUN servers: stun.l.google.com, stun.cloudflare.com
   - They see: <my public IP>:<my source port>
   - They DON'T know who I am (no auth, anonymous)
   - Compare: is my public IP one of the local interfaces?
     - YES → I'm directly connected (have public IP)
     - NO  → I'm behind NAT (CGNAT or router NAT)

3. Check inbound reachability
   - Try to connect to my own public IP on a WireGuard port
   - If I get a response → I'm reachable from outside
   - If timeout / refused → I'm not reachable (CGNAT)

4. Check IPv6
   - Do I have a global IPv6 address?
   - If yes → can use IPv6 for direct connection

5. Report findings
   - Result is local (NOT sent to any server)
   - Result is just metadata: "I can be reached at X via method Y"
```

### Path selection (automatic, no user action)

```
┌────────────────────────────────────────────────────┐
│  Self-test result           →  Selected path        │
├────────────────────────────────────────────────────┤
│  Same LAN as peer (mDNS)    →  LAN (mDNS+WireGuard)│
│  Public IP, reachable       →  Direct (WireGuard)   │
│  Public IPv6, reachable     →  Direct IPv6          │
│  CGNAT, peer has pub IP     →  Outbound to peer     │
│  Both behind CGNAT          →  Customer relay       │
│  No public connectivity     →  Sneakernet (offline) │
│  Has public, peer doesn't   →  Wait for peer's      │
│                                outbound connection  │
└────────────────────────────────────────────────────┘
```

**Important**: "Outbound to peer" works because CGNAT allows
outbound connections and remembers them. If Admin connects to User's
public IP first, the connection is "established" and inbound replies
work. CGNAT's NAT table holds the mapping for ~5 minutes.

This is the same technique WebRTC, BitTorrent, and Tailscale use.

### How devices find each other without a central server

**For LAN**: mDNS broadcast. Zero config. Works on the same network.

**For direct (public IP)**: One of these:
- Manual: User types Admin's public IP
- QR code: User scans QR code showing Admin's public IP
- Last known: App remembers Admin's last public IP, tries it
- Out-of-band: User emails/texts Admin's public IP to themselves

The Cloud can store "last known public IP" as a convenience (it's
just account metadata, not data path), but the device does NOT
depend on it. If the Cloud is down, the device falls back to
manual/last-known/QR.

**For CGNAT (both sides)**: Customer's own relay. They run a small
VM. The relay is their server, on their network. The relay only
sees encrypted traffic (WireGuard is E2E).

**No "us" relay by default.** We don't run a relay. If the user
wants our relay, they opt in (and we clearly disclose what that means).

### Detection runs continuously

The self-test runs:
- On startup
- Every 5 minutes (to detect network changes)
- When a connection fails (to re-evaluate)
- On user request ("test my connection")

If a new path becomes available, the app switches automatically
(e.g., user moves to a network with public IP, app detects, switches
from "customer relay" to "direct").

## Why this is better than a central coordination server

A central server (like Tailscale's) knows:
- Every device's public IP (changes as devices move)
- Every device's reachability
- Every connection attempt
- Who is talking to whom
- When (time, duration, frequency)

We don't have any of this. The device decides locally. The Cloud
is for non-data things only (account, billing, encrypted backups).

**Trade-off**: Setting up cross-network is harder. The user has to:
- Either get a public IP from their ISP (and configure their router)
- Or run a customer relay (small VM)
- Or use sneakernet (USB)

We mitigate by:
- Making LAN mode zero-config (covers 90%)
- Providing a 1-line script for customer relay
- Sneakernet for fully air-gapped
- Clear, friendly UX for the self-test

## What we DON'T do

❌ Run a coordination server (we are not Tailscale)
❌ Run a relay server by default
❌ Store device public IPs centrally (except optional "last known" in Cloud)
❌ Track connection patterns centrally
❌ Use STUN servers to log anything (just for reachability test)
