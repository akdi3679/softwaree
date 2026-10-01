# TASK ID: AUDIT-029.1
# TITLE: Self-audit fix #25: ADR-019 CGNAT detection at startup + automatic path selection
# STATUS: pending
# DEPENDENCIES: AUDIT-028.2
# ALLOWED FILES: docs/architecture/02-DECISIONS/ADR-019-cgnat-detection.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Document the runtime detection + automatic path selection. This is
the core technique that makes the "no central server" architecture work.

## WHY THIS WAS FOUND IN SELF-AUDIT (user feedback from other AI)
The user clarified with another AI: devices detect their own
reachability at startup. CGNAT is just one case of "I can't be
reached from outside." The architecture must handle this without
a central coordination server.

## REQUIRED IMPLEMENTATION

Create `docs/architecture/02-DECISIONS/ADR-019-cgnat-detection.md`:

```markdown
# ADR-019: CGNAT Detection + Automatic Path Selection

## Status
Accepted, 2026-08-22 (refines ADR-017 and ADR-018)

## Context

The user's earlier discussion with another AI clarified an important
point: the architecture should not assume any device has a public IP.

The reality of home / small business networks in 2026:
- ~60% of users are behind CGNAT (their ISP does NAT)
- ~25% have a public IP (often shared, sometimes static)
- ~10% are on corporate networks (very restrictive)
- ~5% have full IPv6

For our product, we cannot assume the Admin is reachable from
the internet. The system must:
1. Detect at startup what the device's situation is
2. Choose the right path automatically
3. Work without a central coordination server

## Decision

Each device, on startup and periodically, runs a self-test:

### Self-test sequence (~5 seconds, runs on startup)

```
1. Check local interfaces
   - Get all IP addresses (IPv4 + IPv6)
   - Get all listening ports
   - Detect: am I on a private network? (10.x, 172.16-31.x, 192.168.x)

2. Check public reachability
   - Try STUN-like query: ask a public server "what's my IP?"
     (use multiple servers: stun.l.google.com, stun.cloudflare.com)
   - The servers see: <my public IP>:<my source port>
   - The servers DON'T know who I am (no auth, anonymous)
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

Based on the self-test, the device picks the best path:

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

So: the device with public IP just LISTENS. The device behind CGNAT
INITIATES the connection. CGNAT allows the response back because
of the established connection.

This is the same technique WebRTC, BitTorrent, and Tailscale use.

### What "no central server" means in practice

The self-test result is local. The device does NOT report its public
IP to any server. Other devices do NOT query a server to find this
device.

How do devices find each other then?

**For LAN**: mDNS broadcast. Zero config. Works on the same network.

**For direct (public IP)**: One of these:
- Manual: User types Admin's public IP
- QR code: User scans QR code showing Admin's public IP
- Last known: App remembers Admin's last public IP, tries it
- Out-of-band: User emails/texts Admin's public IP to themselves

The Cloud can store "last known public IP" as a convenience, but
the device does NOT depend on it. If the Cloud is down, the device
falls back to manual/last-known/QR.

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

The result is cached locally. If a new path becomes available, the
app switches automatically (e.g., user moves to a network with
public IP, app detects, switches from "customer relay" to "direct").

## The full flow when a User app starts

```
1. User app starts
2. Run self-test (5 seconds)
3. Try mDNS for Admin → found on LAN? use LAN
4. If not found, look up last-known public IP from local cache
5. If have IP, try direct WireGuard
6. If direct fails, check: is there a customer relay configured?
7. If relay configured, try via relay
8. If all fail, show "Cannot reach Admin. Possible reasons:
   - Admin is offline
   - Network doesn't allow cross-network
   - Need to set up a relay
   Tap to retry or [Configure relay]"
9. While waiting, periodically retry (backoff)
```

## What the user sees

When self-test runs, they see (briefly):

```
┌────────────────────────────────────────────┐
│  Testing your connection...                │
│                                             │
│  ✓ Local network: 192.168.1.42             │
│  ✓ Public IP: 41.200.50.10                  │
│  ✓ Reachable from outside: yes              │
│  ✓ IPv6: 2001:db8::42                       │
│                                             │
│  Best path: Direct (public IP)             │
└────────────────────────────────────────────┘
```

Or, behind CGNAT:

```
┌────────────────────────────────────────────┐
│  Testing your connection...                │
│                                             │
│  ✓ Local network: 192.168.1.42             │
│  ✓ Public IP detected: 41.200.50.10        │
│  ✗ NOT reachable from outside (CGNAT)      │
│  ✓ IPv6: not available                     │
│                                             │
│  Best path: Customer relay (not yet set up)│
│  Or: Sneakernet (manual USB sync)          │
│                                             │
│  [Set up relay] [Learn about sneakernet]   │
└────────────────────────────────────────────┘
```

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
❌ Run a relay server by default (would be "us in the data path")
❌ Store device public IPs centrally
❌ Use STUN servers to log anything (just for reachability test)
❌ Track connection patterns centrally

## Implementation tasks

1. Build self-test in Rust (port to TS for cross-platform)
2. mDNS responder (Avahi/Bonjour) on every device
3. mDNS querier on every device
4. WireGuard interface bring-up
5. QR code display (Admin's current public IP + pubkey)
6. Connection manager (try paths in order, with backoff)
7. Settings UI: "Test my connection"
8. Customer relay: minimal WireGuard relay image + setup script
9. Sneakernet: SQLite file copy with version check

## Tests

- [ ] Device on LAN, peer on LAN: connects via mDNS
- [ ] Device with public IP, peer with public IP: connects direct
- [ ] Device behind CGNAT, peer with public IP: peer initiates
- [ ] Device with public IP, peer behind CGNAT: device initiates
- [ ] Both behind CGNAT, customer relay configured: connects via relay
- [ ] Both behind CGNAT, no relay: shows "set up relay or use sneakernet"
- [ ] No internet at all: works on LAN, shows offline state
- [ ] Move from WiFi to 4G: self-test detects, switches path
- [ ] Self-test result is local (not sent to any server)
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/02-DECISIONS/ADR-019-cgnat-detection.md || { echo "FAIL"; exit 1; }
grep -q "CGNAT" docs/architecture/02-DECISIONS/ADR-019-cgnat-detection.md || { echo "FAIL"; exit 1; }
echo "OK"
```
