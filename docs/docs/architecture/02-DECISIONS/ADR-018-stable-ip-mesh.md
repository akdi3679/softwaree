# ADR-018: Stable IP Mesh — Identity and Routing

## Status
Accepted, 2026-08-22 (refines ADR-017)

## Context

The user requirement is:

> "Admin and User devices can send and receive requests like a server,
> through a private connection that never drops, with the same IP
> always for the devices, by some techniques, but without any company
> or other server in the format."

In other words:
- Stable IP (e.g., 10.50.0.x) that doesn't change as devices move
- Bidirectional communication (both sides can initiate)
- Connection that "never drops" (reconnects automatically)
- No third party in the data path
- No "stranger company servers" anywhere

## Decision

We build our own minimal mesh with 3 layers. The IP is the **identity**,
not the location. See ADR-019 for how the device detects its own
reachability and picks the path.

### Layer 1: Identity (no server)

Every device generates an Ed25519 keypair on first launch.

- The public key is the device's permanent ID
- The key never changes for the device's lifetime
- The Admin's pubkey is the "project key holder" identity
- A User's pubkey is its identity in the project

The pubkey IS the identity. No server assigns it.

### Layer 2: Stable IP (assigned by us, not by Tailscale)

We assign IPs from a private range: **`10.50.0.0/16`**.

The first device in a project is always `10.50.0.1` (the Admin).
Each User gets the next available IP (`10.50.0.2`, `.3`, `.4`, ...).

These IPs are STABLE. They don't change when:
- The device moves WiFi → 4G
- The device's public IP changes
- The connection goes through a relay instead of direct
- The device restarts

**Why `10.50.0.0/16` and not `10.0.0.0/8`**: millions of home routers
default to `10.0.0.x`. Using `10.50.0.0/16` avoids collision. The
`/16` range gives us 65,534 addresses per project — more than any
customer will have.

**Where these IPs are stored**: in the local SQLite on the Admin
(per project) and in each User app. No server needed.

### Layer 3: Routing (how to reach the IP)

This is where the magic happens. The User app sends a packet to
"10.50.0.1" (the Admin). The OS looks up "how do I reach 10.50.0.1?"
and finds the WireGuard interface. WireGuard then routes via one of:

| Routing | When | Privacy |
|---|---|---|
| **mDNS** (LAN) | Admin and User on same WiFi | 100% local |
| **IPv6** (global) | Both have public IPv6 | 100% direct |
| **Static public IPv4** | Customer has static IP from ISP | 100% direct |
| **NAT traversal** | One side has public IP, other behind CGNAT | 100% direct (after hole-punch) |
| **Customer-hosted relay** | Both behind CGNAT, customer runs a VM | 100% private to customer |
| **Sneakernet** (USB) | No internet at all | 100% manual |

The application layer doesn't know or care which routing is used.
It just sends to 10.50.0.1.

## How "never drops" is achieved

### Keep-alive
WireGuard sends a keep-alive packet every 25 seconds. If no
keep-alive is received in 120 seconds, the connection is considered
dropped.

### Reconnection
When a drop is detected:
1. Try the same route again (immediate)
2. If fail: re-run self-test (network may have changed)
3. Pick new best path
4. Exponential backoff (1s, 2s, 5s, 10s, 30s, cap 30s)
5. Keep retrying forever (until user gives up or connection restored)

### Multi-path
The app can maintain multiple paths simultaneously:
- Direct (LAN, IPv6, or static IP)
- NAT traversal
- Customer relay

The connection is "up" if ANY path works.

## How bidirectional works

Both Admin and User can initiate. WireGuard is bidirectional by design.

Examples:
- Admin pushes a new event to User (Admin → User, normal)
- User submits a command (User → Admin, normal)
- User asks "is Admin still alive?" (User → Admin)
- Admin asks User "what's your local time?" (Admin → User)

Both sides have a WireGuard interface with a stable IP.

## How keys are exchanged (no server)

For LAN mode:
1. Admin shows its pubkey as a QR code in Settings
2. User scans the QR code
3. User's pubkey is encoded in the response QR
4. Admin scans User's response QR
5. Both add each other's pubkey to their WireGuard config
6. Connection established

For cross-network (manual IP, IPv6, static, NAT traversal):
- Same QR code exchange, plus User enters Admin's public IP
  (or vice versa for inbound-initiated patterns)

For customer relay:
- Same QR code exchange, plus both devices are configured with the
  relay's pubkey and IP

No server. No third party. Physical or verbal channel for the keys.

## What we DON'T need a server for

- ❌ Assigning device IDs (pubkey is the ID)
- ❌ Assigning IPs (we assign them locally per project)
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

1. Assign IPs from your own private range (e.g., 10.50.0.x)
2. Use WireGuard (or any mesh VPN) for encryption
3. Use multiple routing methods (mDNS, IPv6, static IP, NAT traversal, customer relay)
4. Let the OS/routing layer handle which method to use
5. Use keep-alive + multi-path for "never drops"

What it requires from the customer:
- LAN mode: zero setup
- Cross-network: configure one of {IPv6, static IP, NAT traversal, customer relay}
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
- We use 10.50.0.x IPs (they use 100.x.y.z)

Functionally similar. Privacy-wise: we win (no stranger company).
