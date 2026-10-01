# TASK ID: AUDIT-006.1
# TITLE: Self-audit fix #2: TAILNET.md update with alternatives table
# STATUS: pending
# DEPENDENCIES: AUDIT-005.2
# ALLOWED FILES: docs/architecture/TAILNET.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Update TAILNET.md to clearly state: mDNS first, our mesh fallback, with
the alternatives table. Justify the choice.

## WHY THIS WAS FOUND IN SELF-AUDIT
The original TAILNET.md implied Tailscale is mandatory. It's actually
optional — mDNS is preferred when available, Tailscale is the fallback
for remote.

## REQUIRED IMPLEMENTATION

Update `docs/architecture/TAILNET.md` — add a section "Discovery order"
near the top:

```markdown
## Discovery order (mDNS first, our mesh fallback)

When a User app needs to find the Admin, it tries in this order:

1. **mDNS / Bonjour** (LAN only, zero config)
   - Sub-millisecond discovery
   - No installation
   - Works when Admin and User are on same WiFi
   - Failure: not on same network

2. **Tailscale** (works anywhere, encrypted)
   - 2-5 second discovery
   - Requires Tailscale installed on both devices
   - Works through any NAT, firewall, CGNAT
   - Uses DERP relay when direct connection fails
   - Failure: Tailscale not installed, or auth expired

3. **Manual IP entry** (fallback)
   - User types Admin's Tailscale IP (e.g., 100.x.y.z)
   - For non-technical users: IT sets it up
   - Failure: user doesn't know the IP

The choice between Tailscale and a hypothetical "we built our own
VPN" was deliberate:

### Alternatives considered

| | Tailscale | Netbird | Nebula | Cloudflare Tunnel | Custom WireGuard |
|---|---|---|---|---|---|
| Setup time | 2 min | 3 min | 5 min | 5 min | 30 min |
| Self-host control | ✅ Headscale | ✅ | ✅ | ❌ | ✅ |
| Works through NAT | ✅ DERP | ✅ | ✅ | ✅ | ❌ |
| Mobile apps | ✅ | ✅ | ❌ | ❌ | ❌ |
| Free for small teams | ✅ | ✅ | ✅ | ✅ | ✅ |
| Battle-tested | ✅ (10K+ companies) | ⚠️ newer | ✅ (Slack-scale) | ✅ | varies |
| Risk of abandonment | low (Y Combinator) | low (newer) | low (Slack) | low | n/a |

**Tailscale won** because:
1. Best non-technical user experience (clinic staff can install it)
2. Cross-platform including iOS/Android (gym, hotel use cases)
3. Headscale means we can self-host (no vendor lock-in)
4. DERP relay means it works through any network
5. If Tailscale Inc. shuts down, we still have Headscale
6. We can swap to Netbird in v2 if needed (same WireGuard underneath)

**mDNS still wins for LAN** because it's truly zero-config. A clinic
where Admin and reception are 5 meters apart doesn't need VPN overhead.
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/TAILNET.md || { echo "FAIL"; exit 1; }
grep -q "Discovery order" docs/architecture/TAILNET.md || { echo "FAIL: no discovery section"; exit 1; }
grep -q "Netbird" docs/architecture/TAILNET.md || { echo "FAIL: no alternatives"; exit 1; }
echo "OK"
```
