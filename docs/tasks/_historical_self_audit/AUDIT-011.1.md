# TASK ID: AUDIT-011.1
# TITLE: Self-audit fix #7: ADR-014 clarify our WireGuard mesh (single binary) architecture
# STATUS: pending
# DEPENDENCIES: AUDIT-010.2
# ALLOWED FILES: docs/architecture/02-DECISIONS/ADR-014-tailscale-headsplit.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Make it explicit: we use the open-source `tailscale` CLIENT + our self-hosted
our discovery service. Our mesh implementation is in the data path.

## WHY THIS WAS FOUND IN SELF-AUDIT
The previous TAILNET update said "Tailscale" without distinguishing
client from control server. Anyone reading it would think we depend
on Tailscale Inc., which is wrong.

## REQUIRED IMPLEMENTATION

Create `docs/architecture/02-DECISIONS/ADR-014-tailscale-headsplit.md`:

```markdown
# ADR-014: Networking — Tailscale Client + Headscale Control Server

## Status
Accepted, 2026-08-09

## Context

There are two pieces to the Tailscale "stack":

1. **The `tailscale` client** — open-source WireGuard-based mesh VPN
   client. BSD-licensed. Runs on each device.
2. **The control server** — the service that authenticates devices,
   distributes keys, enforces ACLs. Tailscale Inc. runs one version
   ("Coordination server"); the open-source community runs another
   ("Headscale").

These are independent. You can use Tailscale's client with Headscale's
control server, or any other combination.

## Decision

We deploy the open-source `tailscale` client on every Admin and User
device, and run our own Headscale control server in our Cloud.

```
┌─────────────────┐
│ Admin laptop    │
│  tailscaled     │──┐
│  (open source)  │  │
└─────────────────┘  │
                     │   WireGuard (kernel)
┌─────────────────┐  │   over Tailscale protocol
│ User laptop     │  │
│  tailscaled     │──┤
│  (open source)  │  │
└─────────────────┘  │
                     ▼
              ┌─────────────┐
              │ Headscale   │  ← our Cloud
              │ (control)   │     self-hosted
              └─────────────┘
                     │
                     │   DERP relay
                     ▼
              ┌─────────────┐
              │ DERP server │  ← our Cloud
              │ (relay)     │     self-hosted
              └─────────────┘
```

## What's NOT in our stack

- ❌ Tailscale Inc.'s coordination server (we run Headscale)
- ❌ Tailscale Inc.'s DERP relay (we run our own)
- ❌ Any Tailscale Inc. service in the data path

## What's in our stack

- ✅ Open-source `tailscale` client (BSD-licensed)
- ✅ Headscale (open-source, AGPL-licensed)
- ✅ Our own DERP relay (open-source, runs anywhere)
- ✅ WireGuard (Linux kernel, MIT-licensed)

## Consequences

### Positive
- Tailscale Inc. can shut down tomorrow and we're fine
- We can audit the entire stack (all open source)
- WireGuard is in the Linux kernel — can't be killed
- The community maintains all pieces (10+ contributors each)
- We can swap to Netbird or Nebula in v2 if needed (same approach)

### Negative
- We operate Headscale ourselves (ops burden, ~1 day/month)
- We operate DERP relay (negligible)
- We need to monitor for upstream security advisories
- We need to keep Headscale updated

### Mitigations
- Headscale is mature (used by 1000+ companies)
- Updates are infrequent (quarterly)
- Security advisories from Tailscale also apply (we follow the same list)
- We have a Headscale update runbook (see runbooks/)

## Cost

- $0 for the client and control server
- ~$5/mo for a small VPS running Headscale
- ~$5/mo for DERP relay (or we run it on the same box)
- Total: ~$10/mo for the entire networking layer
- Compare to: Tailscale Team plan = $5/user/mo × 100 users = $500/mo

## When to revisit

- If Headscale project becomes unmaintained
- If WireGuard is somehow compromised (extremely unlikely)
- If a better alternative emerges (e.g., Netbird matures, BoringTun)

## References

- https://github.com/tailscale/tailscale (BSD-licensed client)
- https://github.com/juanfont/headscale (AGPL-licensed control server)
- https://www.wireguard.com/ (Linux kernel, MIT)
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/02-DECISIONS/ADR-014-tailscale-headsplit.md || { echo "FAIL"; exit 1; }
grep -q "Headscale" docs/architecture/02-DECISIONS/ADR-014-tailscale-headsplit.md || { echo "FAIL"; exit 1; }
echo "OK"
```
