# TASK ID: COMMUNICATION-001.1
# TITLE: Add Tailnet architecture document
# STATUS: pending
# DEPENDENCIES: COMMANDS-001.2
# ALLOWED FILES: /workspace/docs/architecture/TAILNET.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Document the two-tailnet architecture: project tailnet and ops tailnet.

## REQUIRED IMPLEMENTATION

Create `/workspace/docs/architecture/TAILNET.md`:

```markdown
# our mesh architecture

We use our own WireGuard mesh for all cross-device communication. our implementation gives us encrypted WireGuard tunnels with mDNS LAN discovery and customer-relay fallback without managing any of the underlying infrastructure.

We use **our discovery service** in our Cloud (no third party). This keeps all our network metadata in-house.

## Two tailnets

We operate two separate networks (project + ops), both using our own WireGuard mesh with the discovery service in our Cloud.

### 1. Project tailnet (`project.product.local`)

**Members**: Admins and Users for active projects.

**Tags**:
- `tag:admin` — Admin Tauri apps (the project source of truth)
- `tag:user` — User Tauri apps (read-only projections)
- `tag:backup-relay` — Optional: a relay that bridges to a different network

**ACLs** (defined in our mesh, enforced on every packet):
- `tag:admin` → `tag:user`: ALLOW inbound 9420/sync (WebSocket), 9090/metrics (Prometheus)
- `tag:user` → `tag:admin`: ALLOW outbound (same)
- `tag:admin` → `tag:admin`: DENY (no Admin talks to another Admin)
- `tag:user` → `tag:user`: DENY (Users never talk to other Users)
- `tag:user` → `tag:user` ALLOW when on the same mesh ACL group: opt-in (e.g., for a project where Users need to chat)

**Stable IPs**: 100.64.0.0/10. Each device has a stable IP that doesn't change as long as the device is in the tailnet. We use these in Tauri config.

### 2. Ops tailnet (`ops.product.local`)

**Members**: Cloud servers, Admin maintainers, CI runners.

**Tags**:
- `tag:cloud` — Cloud servers
- `tag:ops` — Operations team member devices
- `tag:ci` — CI runners (Woodpecker)

**ACLs**:
- `tag:ops` → `tag:cloud`: ALLOW SSH (22) and HTTP (8787)
- `tag:ci` → `tag:cloud`: ALLOW HTTP (8787) for integration tests
- `tag:cloud` → `tag:project`: ALLOW HTTP (443) for the cloud control plane (Admin auth, module delivery, license check)

**Members cannot access devices they don't own.** A Cloud server cannot SSH into a User device.

## Our mesh setup

- 0 extra VMs — the discovery service runs in the same Cloud VM as Postgres
- We use the `private` DERP map; we run a single DERP server in our own infra
- API key is stored in Infisical, rotated every 90 days
- Pre-authentication keys are issued per device type:
  - Admin: 90-day expiry, reusable false, ephemeral false
  - User: 90-day expiry, reusable false
  - Cloud: no expiry (server keys)
  - CI: 1-day expiry, single-use

## Our mesh client on each device

- **Admin/User Tauri app**: spawns the local WireGuard interface. On first launch, generates an Ed25519 keypair (no auth flow needed — pubkey is the identity).
- **Cloud**: discovery service accepts heartbeats and returns lookups. No pre-auth key needed.
- **CI**: ephemeral nodes, destroyed after each run.

## Fallback paths

### Admin → Cloud

Primary: our mesh (10.50.0.x)
Fallback: public DNS (cloud.product.local over HTTPS) — only for license check + module delivery, never for sync

### User → Admin

Primary: our mesh
Fallback: LAN (mDNS) — only works if the User is on the same LAN as the Admin
Tertiary: DERP relay — automatic via our WireGuard mesh, no app change needed

## What is NOT in any tailnet

- Public users (no, we don't have any — the Admin adds Users explicitly)
- Mobile devices (out of scope for v1)
- Printers / IoT (out of scope)

## Recovery

If our discovery service goes down:
- All existing connections keep working (WireGuard uses cached state)
- New connections fail until discovery comes back up (or use LAN / customer relay)
- After discovery recovers, the mesh auto-resyncs
- We monitor discovery with Prometheus, alert on `discovery_lookups_failed` spike

If a DERP server goes down:
- Customers can opt in to customer-hosted relay for cross-network fallback
- If all DERPs are down, no new direct connections can be established
- Existing direct connections are unaffected

## Failure modes and what the user sees

| Failure | User impact |
|---------|-------------|
| Discovery down | Cross-network lookups fail; LAN and direct still work; existing connections keep working |
| DERP down | New connections may take longer to establish; existing ones keep working |
| Admin device offline | Users see stale data; writes are blocked |
| User device offline | Admin doesn't know; sync resumes when User comes back |
| Cloud down | Admin can't add new users or fetch modules; existing data still works |
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/TAILNET.md || { echo "FAIL"; exit 1; }
grep -q "Two tailnets" docs/architecture/TAILNET.md || { echo "FAIL"; exit 1; }
grep -q "discovery" docs/architecture/TAILNET.md || { echo "FAIL: no discovery"; exit 1; }
echo "OK"
```
