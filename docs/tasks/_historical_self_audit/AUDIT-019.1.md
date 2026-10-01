# TASK ID: AUDIT-019.1
# TITLE: Self-audit fix #15: TAILNET.md → LOCAL-NETWORKING.md (full rewrite)
# STATUS: pending
# DEPENDENCIES: AUDIT-018.2
# ALLOWED FILES: docs/architecture/TAILNET.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
The old TAILNET.md is wrong now (we don't use Tailscale/Headscale).
Replace it with a doc that explains the 3 modes (LAN, manual, relay).

## WHY THIS WAS FOUND IN SELF-AUDIT (user feedback)
The user wants no third party. The old doc talked about Tailscale
and Headscale. Need a full rewrite explaining the new architecture.

## REQUIRED IMPLEMENTATION

Replace `docs/architecture/TAILNET.md` with:

```markdown
# Networking — How Devices Find Each Other

> **The principle**: your data flows directly between your devices.
> No third party is in the path. No server we run is in the path.
> You control everything.

## The three modes

### Mode 1: LAN (default)

```
Admin ◄──── mDNS + WireGuard ────► User
        Same WiFi
        No server
        No third party
        Works offline
```

**Setup time**: 30 seconds
**Technical skill**: zero
**Internet required**: no
**Privacy**: 100% local

**How**:
1. Admin and User are on the same WiFi
2. User app scans for Admin via mDNS
3. When found, User shows "Admin found: Dr. Smith's Clinic"
4. User scans Admin's QR code (or types the 6-word phrase)
5. WireGuard keys are exchanged
6. Connection established, encrypted

**Used by**: ~90% of our customers (most are small teams on one WiFi)

### Mode 2: Manual IP (no server)

```
Admin (public IP) ◄──── WireGuard ────► User (anywhere)
                  Direct connection
                  No server
                  No third party
```

**Setup time**: 5 minutes
**Technical skill**: low (need to find Admin's public IP)
**Internet required**: yes
**Privacy**: 100% direct

**How**:
1. Admin's user finds their public IP (https://ifconfig.me)
2. Admin configures port forwarding on their router (port 51820 UDP)
3. Admin shares their public IP with the User (e.g., via the invite email)
4. User enters Admin's IP in User app
5. WireGuard connects directly

**Used by**: customers whose Admin has a static public IP

### Mode 3: Customer-hosted relay (optional)

```
Admin ◄──── WireGuard ────► Customer's relay VM ◄──── User
                        E2E encrypted
                        Customer's server
                        We never see it
                        $5/mo (Hetzner/DO)
```

**Setup time**: 15 minutes
**Technical skill**: medium
**Internet required**: yes
**Privacy**: 100% (relay can't decrypt, customer's server)

**How**:
1. We provide a `relay-setup.sh` script
2. Customer runs it on a $5/mo VPS (their account, their server)
3. Script installs WireGuard in relay mode
4. Customer pastes the relay's IP into both Admin and User apps
5. WireGuard connections go through the relay
6. Customer can audit, modify, or replace the relay anytime

**Used by**: customers who need cross-network access and don't want our relay

### Mode 4: Our hosted relay (opt-in, convenience)

```
Admin ◄──── WireGuard ────► Our relay (E2E) ◄──── User
                          Opt-in only
                          $5/mo extra
                          We see IPs, not data
```

**Setup time**: 2 minutes
**Technical skill**: zero
**Internet required**: yes
**Privacy**: we see your device IPs (for routing), not your data

**How**:
1. Customer enables "Remote Access (convenience mode)" in Settings
2. We spin up a relay in our Cloud
3. Admin and User automatically connect
4. We charge $5/mo extra
5. Customer can disable anytime

**Used by**: non-technical customers who need cross-network

## Discovery order (when User app starts)

The User app tries, in order:

1. **mDNS on current WiFi** (instant, zero config)
2. **Cached Admin IP** (if User connected before)
3. **Manual IP** (if User entered one)
4. **Customer relay** (if configured)
5. **Our hosted relay** (if opted in)

The first one that works wins. The User sees "Connected" and a small
icon showing which mode.

## WireGuard key exchange (the security part)

When User first connects to Admin:

1. Admin generates a WireGuard keypair (one-time, on first use)
2. Admin shows its public key as a QR code in Settings
3. User scans QR code (or types 6-word phrase: "ocean-purple-tiger-rose-mountain-cloud")
4. User's public key is encoded in the QR code
5. Admin scans User's QR code (or User types Admin's)
6. Both add each other's public key to their peer list
7. Connection established

**No server is involved in the key exchange.** The QR code is a
physical channel (you scan it in the same room) or a verbal channel
(you read the 6 words over the phone).

**Key rotation**: every 2 minutes, both devices generate new keys
(default WireGuard behavior). Old keys are discarded.

## What if User is offline (no internet)?

- LAN mode: works completely offline (within WiFi range)
- Other modes: User sees cached data only
- User app caches the last 7 days of events
- When User comes back online, full sync happens

## What if Admin is offline?

- LAN mode: User sees cached data, no new events
- Cross-network modes: User sees "Admin not seen in X minutes"
- When Admin comes back: full sync

**Important**: if Admin is offline, Users can READ but not WRITE.
This is v1 behavior. v2 may add offline write queue.

## What if a customer has no internet at all?

This is supported. The customer is in LAN mode only.
- They have one Admin + N Users on the same WiFi
- All data flows on LAN
- Encrypted backups are stored on a local USB drive (we provide a script)
- No Cloud account needed (Local plan is fully offline)

This is great for:
- Clinics in developing countries
- Remote food labs
- Hospital basements
- Industrial facilities
- Any customer who values privacy above all

## What we NEVER do

- ❌ Put our Cloud in the data path
- ❌ Require any third-party VPN
- ❌ Log device IPs in our Cloud (except opt-in relay mode)
- ❌ Store WireGuard keys anywhere except the device that generated them
- ❌ Allow our staff to see customer data
- ❌ Send data to any analytics service without explicit opt-in

## How this affects other parts of the system

### Cloud
- Cloud is for: account, billing, encrypted backups, key escrow
- Cloud is NOT for: data sync, key exchange, device discovery
- Cloud can be down, your LAN still works

### Updates
- Cloud tells Admin "new version available"
- Admin downloads from Cloud (or a mirror, or a USB stick)
- Binary is signed, Admin verifies before installing
- Updates never contain data, only code

### Marketplace
- Cloud hosts the module catalog
- Admin downloads modules from Cloud
- Modules are signed (triple-sign), Admin verifies
- We never see what modules the customer actually runs (Cloud only sees downloads)

## When to use each mode

| Situation | Mode |
|---|---|
| Clinic, all staff on same WiFi | LAN |
| Doctor on call, wants to check from home | Manual IP, customer relay, or our relay |
| Hospital with multiple buildings on same campus | LAN (or VLAN) |
| Multi-site clinic, staff sometimes travel | Customer relay or our relay |
| Food lab in a basement, no internet | LAN only |
| Privacy-maximalist | LAN only, no Cloud backups |
| Non-technical customer who needs remote | Our hosted relay (opt-in) |
| Enterprise with corporate VPN | Customer's existing VPN + manual IP |

## Migration from old architecture

The previous design used Tailscale + Headscale. This was changed
because:

1. Tailscale Inc. knows the device-to-user mapping (privacy concern)
2. Even Headscale (self-hosted) is a server we operate (still a privacy concern)
3. Customers may have no internet at all (LAN must work offline)

The new architecture is more pure but requires more customer setup
for cross-network. We mitigate this with our opt-in hosted relay.

This change is locked in for v1.0.
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/TAILNET.md || { echo "FAIL"; exit 1; }
grep -q "LAN" docs/architecture/TAILNET.md || { echo "FAIL: no LAN"; exit 1; }
grep -q "WireGuard" docs/architecture/TAILNET.md || { echo "FAIL: no WireGuard"; exit 1; }
! grep -q "Tailscale" docs/architecture/TAILNET.md && echo "OK: Tailscale removed" || { echo "FAIL: Tailscale still there"; exit 1; }
echo "OK"
```
