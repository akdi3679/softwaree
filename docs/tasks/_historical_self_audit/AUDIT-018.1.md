# TASK ID: AUDIT-018.1
# TITLE: Self-audit fix #14: ADR-017 pure local networking, no third party (replaces ADR-014)
# STATUS: pending
# DEPENDENCIES: AUDIT-017.2
# ALLOWED FILES: docs/architecture/02-DECISIONS/ADR-017-pure-local-networking.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Drop Tailscale AND Headscale. Customer's data flows directly between
their devices, with zero third-party dependency. The customer opts in
to any cross-network relay, and even then it's E2E encrypted.

## WHY THIS WAS FOUND IN SELF-AUDIT (user feedback)
The user pointed out: Tailscale/Headscale still means a server knows
the device mapping. For a privacy-focused product, this is wrong.
Customers may also have no internet at all (clinics in developing
countries, basements, remote labs). The architecture must work
completely offline on LAN.

## REQUIRED IMPLEMENTATION

Create `docs/architecture/02-DECISIONS/ADR-017-pure-local-networking.md`:

```markdown
# ADR-017: Pure Local Networking — No Third Party

## Status
Accepted, 2026-08-09 (supersedes ADR-014)

## Context

ADR-014 said: use open-source `tailscale` client + our self-hosted Headscale.

The user correctly pointed out: even Headscale is a server that knows
the device-to-user mapping. That's a privacy problem for a product
that promises "we can't see your data."

A clinic in a basement, a food lab in a developing country, a hospital
with strict internet policy — they may have no internet at all. Our
architecture must work completely offline on LAN.

## Decision

**No third party in the data path. Customer's data flows Admin ↔ User
directly. Cloud is for billing/auth/backups only, never for sync.**

### The three modes

#### Mode 1: LAN-only (default, 90% of customers)

```
Admin laptop ◄──────mDNS──────► User laptop
         WireGuard (E2E)
         No server
         No third party
         Works offline
         Zero config
```

- Admin and User are on the same WiFi
- mDNS discovers them automatically
- WireGuard encrypts the connection (keys exchanged via QR code or invite)
- No server anywhere in the path
- Works completely offline (within the LAN)
- Even if the entire internet is down, this works

**This is the default for 90%+ of customers:**
- A clinic's reception (1 Admin, 1-3 staff) is on the same WiFi
- A food lab (1 Admin, 1-5 staff) is on the same WiFi
- A gym's front desk (1 Admin, 1-2 staff) is on the same WiFi
- A small hotel is on the same WiFi
- A school office and classrooms are on the same WiFi

#### Mode 2: Manual IP (no server, no third party)

```
Admin has public IP ─────► User anywhere
                    WireGuard
                    No server
                    No third party
```

- If Admin has a static public IP (rare, but some ISPs offer this)
- User types Admin's IP + port
- WireGuard connects directly
- No server, no third party
- More setup, but fully self-hosted

#### Mode 3: Customer-hosted relay (optional, opt-in)

```
Admin ──► Customer's relay VM ──► User
       WireGuard E2E
       Customer runs the relay
       We never see it
       ~$5/mo on Hetzner/DO
```

- Customer runs a small VM (we provide an image)
- VM is theirs, in their account
- Relays encrypted traffic only (can't read)
- Customer can audit the relay code (open source)
- For customers who need cross-network access but don't want to depend on us

#### Mode 4: Our hosted relay (opt-in, "convenience mode")

```
Admin ──► Our relay (E2E encrypted) ──► User
       Customer opted in
       We see IPs but not data
       $5/mo extra
```

- Customer can opt-in to our hosted relay
- We see their public IPs (for routing)
- We CANNOT see the data (WireGuard is E2E)
- Disabled by default — privacy first
- For non-technical customers who need remote access

### What we NEVER do

❌ Put our Cloud in the data sync path
❌ Require Tailscale, Headscale, or any third-party VPN
❌ Require internet for LAN operation
❌ Store device location info (we don't need it)
❌ Log IP-to-device mappings in our Cloud

### What the Cloud DOES do (not in data path)

- Account management (auth, billing, subscription)
- Encrypted backup storage (we can't read the data)
- Key escrow (only used for Admin device replacement)
- Marketplace (module discovery)
- Admin console (web UI for the customer)
- Updates (push notification "new version available")
- Telemetry (opt-in, anonymous)

The Cloud is NOT in the data path for sync. Customers who want can
self-host even the Cloud components (v2).

### How WireGuard keys are exchanged

In LAN mode, when a User wants to connect to Admin:

1. Admin shows a QR code (or 6-word phrase) in Settings
2. User scans the QR code (or types the phrase) in User app
3. User's pubkey is sent to Admin via the QR code (encoded)
4. Admin adds User to its allowed peers list
5. User connects via mDNS + WireGuard
6. Keys are rotated every 2 minutes (default WireGuard behavior)

No server. No third party. No log anywhere.

In cross-network mode:

1. Same QR/phrase exchange
2. Plus: User needs Admin's public IP (or relay address)
3. Same connection flow

### What if customer needs remote but doesn't want our relay?

Options (in order of recommendation):

1. **Get a static IP from their ISP** ($5-15/mo, varies by country)
2. **Run a customer-hosted relay** (we provide a script, ~$5/mo VM)
3. **Use their existing corporate VPN** (if they have one)
4. **Use a VPS as a WireGuard endpoint** ($5/mo, customer runs it)
5. **Opt in to our hosted relay** (easiest, $5/mo extra)
6. **Accept LAN-only** (most customers don't need remote)

### What about updates?

The Cloud tells Admin "new version available". Admin downloads from
our CDN (or our Cloud, or any mirror). The binary is signed with
our release key. Admin verifies before installing.

User app: same. Admins can pin versions for compliance.

### What about discovery when the Admin's IP changes?

In LAN mode: mDNS handles it. No IP knowledge needed.

In manual IP mode: customer updates the IP in their User app
manually when it changes. We provide a "discover new IP" tool that
sends a ping through any connected peer.

In relay mode: relay handles reconnection. User just sees "connected"
again.

## Consequences

### Positive
- True privacy: no third party knows your device mapping
- True offline: works with no internet at all (LAN mode)
- True local-first: data never leaves the LAN unless user explicitly enables
- Simpler mental model: "your data is on your devices, period"
- Cheaper: no Tailscale subscription, no Headscale ops
- Works in hostile networks (no outbound traffic to detect)

### Negative
- Cross-network access requires more customer setup (unless they use our relay)
- No automatic NAT traversal for cross-network (need port forward or relay)
- Customer-hosted relay adds ops complexity
- Less polished UX than Tailscale (we have to build discovery + key exchange)

### Mitigations
- LAN mode covers 90% of customers (most are on same WiFi)
- We provide a 1-command setup script for customer-hosted relay
- Our hosted relay is opt-in for the lazy/convenience case
- Documentation in 8 languages
- Support helps with setup

## When to revisit

- If customers consistently ask for easier cross-network access (add our relay as default for non-Enterprise tiers)
- If Tailscale changes its model in a way that affects us
- If we have engineering capacity to build auto-relay (relay that runs on Admin and is reachable)

## Migration from ADR-014

The previous ADR-014 is superseded. Code that referenced Tailscale
or Headscale should be updated to use:
- mDNS for LAN discovery (was: mDNS, fine)
- WireGuard for encryption (was: WireGuard, fine)
- Manual IP / customer relay for cross-network (was: Tailscale, change)

This is a significant change to the implementation but not to the
user-facing model. The customer still doesn't see "Tailscale" anywhere.

## References

- mDNS / Bonjour (RFC 6762)
- WireGuard (in Linux kernel)
- Our previous ADR-014 (now superseded)
- Feedback from user on 2026-08-09
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/02-DECISIONS/ADR-017-pure-local-networking.md || { echo "FAIL"; exit 1; }
grep -q "Pure Local" docs/architecture/02-DECISIONS/ADR-017-pure-local-networking.md || { echo "FAIL"; exit 1; }
echo "OK"
```
