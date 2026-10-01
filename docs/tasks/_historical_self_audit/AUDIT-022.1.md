# TASK ID: AUDIT-022.1
# TITLE: Self-audit fix #18: ADR-018 stable IP via private mesh, no third party
# STATUS: pending
# DEPENDENCIES: AUDIT-021.2
# ALLOWED FILES: docs/architecture/02-DECISIONS/ADR-018-stable-ip-mesh.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
The user wants: devices always see each other at the same IP, no
third party in the path, no stranger's server, no Cloud involvement
in the data path. This ADR explains the technique that makes this work.

## THE TECHNIQUE (3 layers)

### Layer 1: Stable identity (no server)
- Each device has an Ed25519 keypair (already in the spec)
- Public key = device ID
- "Admin" device is known by its public key fingerprint
- No server assigns this

### Layer 2: Stable IP (assigned by us, our own scheme)
- We assign IPs from a private range: 10.0.0.0/8
- Admin gets 10.0.0.1 (the first device in the project)
- Each User gets the next IP (10.0.0.2, .3, .4, ...)
- These IPs are STABLE — they don't change as the device moves
- From the User's perspective, Admin is ALWAYS at 10.0.0.1

This is the "Tailscale trick" but we do it ourselves. No third party.

### Layer 3: Routing (how the IP is reached)
- LAN: mDNS resolves "admin.local" to its actual LAN IP, WireGuard sends there
- IPv6: Admin has stable public IPv6 (e.g., 2001:db8::1), WireGuard sends there
- Static IP: customer has static IP from ISP, WireGuard sends there
- Customer relay: customer's own server forwards 10.0.0.1 ↔ Admin's actual IP
- Our relay (opt-in): same, but we run it (clearly labeled)

The User app doesn't care which routing is used. It just sends to 10.0.0.1, the OS/routing layer figures out the rest.

## WHY THIS WAS FOUND IN SELF-AUDIT (user feedback)
The user pushed back: Tailscale/Headscale still have servers. They
want NO third party, period, and they want devices to "always be at
the same IP". This ADR formalizes the technique.

## REQUIRED IMPLEMENTATION

Create `docs/architecture/02-DECISIONS/ADR-018-stable-ip-mesh.md`:

```markdown
# ADR-018: Stable IP Mesh — Same IP, No Third Party

## Status
Accepted, 2026-08-09 (refines ADR-017)

## Context

The user requirement is:

> "Admin and User devices can send and receive requests like a server,
> through a private connection that never drops, with the same IP
> always for the devices, using some techniques, but without any
> company or other server in the format."

In other words:
- Stable IP (10.0.0.x) that doesn't change as devices move
- Bidirectional communication (both sides can initiate)
- Connection that "never drops" (reconnects automatically)
- No third party in the data path
- No "stranger company servers" anywhere

## Decision

We build our own minimal mesh with 3 layers.

### Layer 1: Identity (no server)

Every device generates an Ed25519 keypair on first launch.

- The public key is the device's permanent ID
- The key never changes for the device's lifetime
- The Admin's pubkey is the "project key holder" identity
- A User's pubkey is its identity in the project

The pubkey IS the identity. No server assigns it. No one can revoke
it without access to the private key.

### Layer 2: Stable IP (assigned by us, not Tailscale)

We assign IPs from a private range: `10.0.0.0/8` (or `100.64.0.0/10`
like Tailscale, our choice — using 10.0.0.0/8 since it's familiar).

The first device in a project is always `10.0.0.1` (the Admin).
Each User gets the next available IP (`10.0.0.2`, `.3`, `.4`, ...).

These IPs are STABLE. They don't change when:
- The device moves WiFi → 4G
- The device's public IP changes
- The connection goes through a relay instead of direct
- The device restarts

This is the "same IP always" requirement.

**Where these IPs are stored**: in the local SQLite on the Admin
(per project) and in each User app. No server needed.

### Layer 3: Routing (how to reach the IP)

This is where the magic happens. The User app sends a packet to
"10.0.0.1" (the Admin). The OS looks up "how do I reach 10.0.0.1?"
and finds the WireGuard interface. WireGuard then routes via one of:

| Routing | When | Privacy |
|---|---|---|
| **mDNS** (LAN) | Admin and User on same WiFi | 100% local |
| **IPv6** (global) | Both have public IPv6 | 100% direct |
| **Static public IP** | Customer has static IP from ISP | 100% direct |
| **Customer-hosted relay** | Customer runs a tiny VM | 100% private to customer |
| **Our hosted relay** (opt-in) | Customer enabled convenience mode | We see IPs, not data |

The application layer doesn't know or care which routing is used.
It just sends to 10.0.0.1.

## How "never drops" is achieved

### Keep-alive
WireGuard sends a keep-alive packet every 25 seconds (configurable).
If no keep-alive is received in 120 seconds, the connection is
considered dropped.

### Reconnection
When a drop is detected:
1. Try the same route again (immediate)
2. If fail: try alternative route (LAN → IPv6 → static IP → relay)
3. If all fail: exponential backoff (1s, 2s, 5s, 10s, 30s, cap 30s)
4. Keep retrying forever (until user gives up or connection restored)

### Multi-path
The app can maintain multiple paths simultaneously:
- Direct (LAN or IPv6 or static IP)
- Via relay
- Whichever responds first wins

The connection is "up" if ANY path works.

### What causes drops
- WiFi → 4G handover: 1-3 seconds, usually seamless
- Sleep/wake: 5-10 seconds, reconnect happens
- Admin restart: 10-30 seconds, reconnect happens
- Network outage: until network restored
- Tailscale-style DERP failure: irrelevant (we don't use DERP)

In all cases, the user sees "Reconnecting..." briefly, then back to
"Connected" without losing data.

## How bidirectional works

Both Admin and User can initiate. WireGuard is bidirectional by
design.

Examples:
- Admin pushes a new event to User (Admin → User, normal)
- User submits a command (User → Admin, normal)
- User asks "is Admin still alive?" (User → Admin)
- Admin asks User "what's your local time?" (Admin → User)

Both sides have a WireGuard interface with a stable IP. Either side
can send to the other.

## How keys are exchanged (no server)

For LAN mode:
1. Admin shows its pubkey as a QR code in Settings
2. User scans the QR code
3. User's pubkey is encoded in the response QR
4. Admin scans User's response QR
5. Both add each other's pubkey to their WireGuard config
6. Connection established

For cross-network (manual IP, IPv6, static):
- Same QR code exchange, plus User enters Admin's public IP

For customer relay:
- Same QR code exchange, plus both devices are configured with the
  relay's pubkey and IP

No server. No third party. Physical or verbal channel for the keys.

## What we DON'T need a server for

- ❌ Assigning device IDs (pubkey is the ID)
- ❌ Assigning IPs (we assign them locally)
- ❌ Finding devices (mDNS for LAN, IP/relay config for WAN)
- ❌ Authenticating connections (WireGuard keys)
- ❌ Routing traffic (the OS handles it)
- ❌ Knowing who is online (optional, can be derived from connections)

## What we DO need a server for (NOT in data path)

- Account management (we know: who signed up, what plan, billing)
- Encrypted backup storage (we have: encrypted blobs we can't read)
- Key escrow (we have: wrapped project keys, used for Admin replacement)
- Module marketplace (we host: signed module binaries)
- Updates (we serve: signed binaries over HTTPS)
- Telemetry (opt-in: anonymous usage data)

None of these are in the data path. The Cloud can be down, your
devices keep syncing on LAN or via your relay.

## The "is it possible?" question

**Yes.** Stable IP without any third party is possible. The technique:

1. Assign IPs from your own private range (e.g., 10.0.0.x)
2. Use WireGuard (or any mesh VPN) for encryption
3. Use multiple routing methods (mDNS, IPv6, static IP, customer relay)
4. Let the OS/routing layer handle which method to use
5. Use keep-alive + multi-path for "never drops"

What it requires from the customer:
- LAN mode: zero setup
- Cross-network: configure one of {IPv6, static IP, customer relay}
  OR opt-in to our hosted relay

What's NOT possible:
- Stable public IP without either a static IP, IPv6, or a relay
- Reliable cross-NAT without one of the above
- Without ANY server anywhere (we still have our Cloud for non-data things)

## Comparison to Tailscale

Tailscale does basically the same thing, but:
- They run the coordination server (we don't for the data path)
- They run the DERP relay (we offer customer-hosted or opt-in)
- They charge $5/user/mo (we don't, our Cloud isn't in this path)
- We use 10.0.0.x IPs (they use 100.x.y.z)

Functionally similar. Privacy-wise: we win (no stranger company).

## Implementation tasks

1. Define `10.0.0.1` as Admin in all project configs
2. Generate WireGuard keypairs on first launch
3. QR code exchange UI (Admin shows, User scans)
4. mDNS resolution: Admin listens on `admin.local:51820`
5. IPv6 fallback: if both have IPv6, use that
6. Static IP fallback: customer enters in Settings
7. Customer relay config: customer enters relay pubkey + IP
8. Keep-alive: every 25s, fail at 120s
9. Multi-path: try all known routes in parallel

## Tests

- [ ] LAN: Admin at 10.0.0.1, User at 10.0.0.2, can ping each other
- [ ] IPv6: cross-network, both have IPv6, can connect
- [ ] Static IP: cross-network, customer has static IP, can connect
- [ ] Customer relay: cross-network, behind NAT, can connect via relay
- [ ] WiFi → 4G: connection drops for 2s, reconnects automatically
- [ ] Sleep/wake: connection drops for 10s, reconnects automatically
- [ ] Admin restart: User sees "Reconnecting" then "Connected"
- [ ] Network outage: User sees "Offline" then "Connected" when network restored
- [ ] Stable IP: User's view of Admin is always 10.0.0.1, no matter the routing
- [ ] No third party: data never goes through any stranger company's server
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/02-DECISIONS/ADR-018-stable-ip-mesh.md || { echo "FAIL"; exit 1; }
grep -q "Stable IP" docs/architecture/02-DECISIONS/ADR-018-stable-ip-mesh.md || { echo "FAIL"; exit 1; }
echo "OK"
```
