# TASK ID: AUDIT-021.1
# TITLE: Self-audit fix #17: SYNC-PROTOCOL update — drop Tailscale
# STATUS: pending
# DEPENDENCIES: AUDIT-020.2
# ALLOWED FILES: docs/architecture/SYNC-PROTOCOL.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
The SYNC-PROTOCOL.md mentions Tailscale/Headscale in the connection
section. Update to the new architecture.

## WHY THIS WAS FOUND IN SELF-AUDIT (user feedback)
Consistency with the rest of the architecture. The connection layer
is now mDNS + WireGuard, not Tailscale.

## REQUIRED IMPLEMENTATION

Find the "Connection" or "Transport" section in `docs/architecture/SYNC-PROTOCOL.md`
and update. The new section should be:

```markdown
## Transport

The sync protocol runs over WebSocket, encrypted with WireGuard.

**Default (LAN)**:
- Admin listens on port 51820 (WireGuard) and forwards to localhost:9090 (WebSocket)
- User connects to Admin's mDNS-resolved address: `admin.local:9090`
- E2E encrypted by WireGuard (UDP 51820) + TLS for WebSocket

**Cross-network**:
- User connects to Admin's public IP (or relay): `admin.example.com:9090`
- WireGuard handshake happens first
- WebSocket opens on top
- All data is E2E encrypted (WireGuard handles encryption, WebSocket adds nothing)

**What we never do**:
- Send sync data through our Cloud
- Use any third-party VPN
- Log connection metadata in our Cloud
- Expose Admin's WebSocket port to the public internet (unless customer enables manual IP mode)
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/SYNC-PROTOCOL.md || { echo "FAIL"; exit 1; }
! grep -q "Tailscale\|Headscale" docs/architecture/SYNC-PROTOCOL.md && echo "OK: no Tailscale" || { echo "FAIL: Tailscale still there"; exit 1; }
grep -q "WireGuard" docs/architecture/SYNC-PROTOCOL.md || { echo "FAIL: no WireGuard"; exit 1; }
echo "OK"
```
