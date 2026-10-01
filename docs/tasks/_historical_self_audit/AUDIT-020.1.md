# TASK ID: AUDIT-020.1
# TITLE: Self-audit fix #16: 00-OVERVIEW.md update — pure local messaging
# STATUS: pending
# DEPENDENCIES: AUDIT-019.2
# ALLOWED FILES: docs/architecture/00-OVERVIEW.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
The top-level overview should reflect the new "no third party" stance.
Customers read this first.

## WHY THIS WAS FOUND IN SELF-AUDIT (user feedback)
The previous 00-OVERVIEW.md mentioned Tailscale in passing. Need to
remove all third-party references and emphasize pure local.

## REQUIRED IMPLEMENTATION

Update `docs/architecture/00-OVERVIEW.md` — find the section about
networking and replace it. The new section should say:

```markdown
## Networking — no third party in the data path

Your data flows directly between your devices. We don't run a server
in the path. No third party is involved.

**Default mode: LAN (zero config, works offline)**
- Admin and User on the same WiFi
- mDNS discovery, WireGuard encryption
- No internet required
- 90% of customers are happy with this

**Cross-network modes (optional)**:
- Manual IP (if Admin has a public IP)
- Customer-hosted relay ($5/mo, customer's server)
- Our hosted relay ($5/mo, opt-in, E2E encrypted)

**What we never do**:
- Put our Cloud in your data path
- Require Tailscale, Headscale, or any third-party VPN
- Log your device IPs (except opt-in relay)
- See your WireGuard keys
```

The full document should also have the line:

> "We can't see your data. We never could. We never will. There is
> no third party we depend on to deliver this promise."

## TESTS

```bash
cd /workspace
test -f docs/architecture/00-OVERVIEW.md || { echo "FAIL"; exit 1; }
grep -q "no third party" docs/architecture/00-OVERVIEW.md || { echo "FAIL"; exit 1; }
echo "OK"
```
