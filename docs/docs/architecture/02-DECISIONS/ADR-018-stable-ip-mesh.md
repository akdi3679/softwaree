# ADR-018: Stable Addressing and Routing in the Project Mesh

**Status:** Accepted — amended 2026-11-20
**Date:** 2026-08-22 (refines ADR-017)
**Amended:** 2026-11-20 — userspace stack (no OS routes), per-project namespaces, pubkey-is-identity clarified, keepalives named distinctly, sneakernet defined, discovery reconciled
**Deciders:** Architecture team
**See also:** ADR-017 (parent), ADR-019 (self-test), ADR-020 (discovery), ADR-024 (tunnel + relay), ADR-009 (Admin offline), ADR-012 (membership)

---

## Context

The user requirement:

> *"Admin and User devices can send and receive requests like a server, through a private connection that never drops, with the same IP always for the devices, by some techniques, but without any company or other server in the format."*

In other words: a stable address that survives network changes, bidirectional communication, automatic reconnection, and no third party in the data path.

---

## Decision

Three layers. **The public key is the identity. The virtual IP is a stable address bound to that identity — it is not a credential.**

### Layer 1: Identity (no server required)

Every device generates two keypairs on first launch (ADR-010):
- **Ed25519** — signing identity. The public key is the device's permanent ID.
- **X25519** — key wrapping (module Content Keys, ADR-007).

The private keys live in the OS keychain and never leave the device. No server assigns identity. An address alone proves nothing: every session is authenticated by the peer's key.

### Layer 2: Stable addressing (allocated locally, per project)

Addresses come from **`10.50.0.0/16`**, allocated **inside each project's namespace**:

| Role | Address within the project |
|---|---|
| Admin | `10.50.0.1` |
| User 1 | `10.50.0.2` |
| User 2 | `10.50.0.3` |
| User N | `10.50.0.(N+1)` |

These addresses are stable. They do not change when the device moves Wi-Fi → 4G, when its public IP changes, when the path switches to a relay, or when it restarts.

**Namespacing is mandatory.** A Plan 4 Admin hosting several projects, or a User who belongs to two projects, would otherwise have ambiguous addresses. Therefore:

- Every lookup, route and socket is keyed by **`(project_id, virtual_ip)`**.
- Each project runs its **own tunnel instance with its own local UDP port**. Two projects on one machine never share a socket or an address space.
- A device in two projects has one address per project, and two independent tunnels.

**Why `10.50.0.0/16` and not `10.0.0.0/8`:** millions of home routers default to `10.0.0.x`. `10.50.0.0/16` reduces — but cannot eliminate — collision with corporate LANs and VPNs. Because the tunnel is **userspace** (ADR-024), these addresses exist only inside the app's own network stack. **No OS route is added or changed**, so a real LAN that happens to use `10.50.x.x` keeps working. The `/16` gives 65,534 usable addresses per project.

**Where addresses are stored:** in `mesh_peers` inside each `project.db` on the Admin (ADR-012), and in the User's local state. Allocation needs no server.

### Layer 3: Routing (how an address is reached)

The application sends to `(project, 10.50.0.1)`. The **in-app userspace stack** — not the OS — resolves how to reach it:

| Path | When | Privacy |
|---|---|---|
| **LAN (mDNS)** | Admin and User on the same network | 100% local, no internet |
| **Direct IPv6** | Both have reachable global IPv6 | 100% direct |
| **Direct public IPv4** | One side reachable (static IP or port-mapped) | 100% direct |
| **UDP hole-punch** | Both behind NAT, at least one cooperative | 100% direct after the punch |
| **Customer-hosted relay** | Customer runs their own relay | Their server, ciphertext only |
| **Our blind relay (opt-in)** | Hole-punch fails, no customer relay | Forwards ciphertext it cannot read |
| **TCP/443 fallback** | UDP blocked by the network | Same encryption, different carrier |
| **Sneakernet (USB)** | No connectivity at all | **Read-only snapshot export/import — never writes** (ADR-002) |

The application layer neither knows nor cares which path is in use.

---

## How "never drops" is achieved

### Keep-alive (WireGuard layer)

WireGuard sends a keep-alive packet every **25 seconds**. If nothing is received for **120 seconds**, the path is considered dropped.

This is one of **three distinct keepalives**, never referred to by the same name:

| Name | Layer | Interval |
|---|---|---|
| WireGuard keep-alive | tunnel | 25 s |
| Admin session keepalive | WebSocket, User ↔ Admin (ADR-009) | 30 s |
| Discovery heartbeat | HTTPS, device → Cloud (ADR-020) | 60 s |

### Reconnection

```
1. Retry the same path immediately
2. If it fails: re-run the reachability self-test (ADR-019) — the network may have changed
3. Re-walk the path ladder (ADR-017): LAN → cached → discovery → punch → relay
4. Exponential backoff: 1s, 2s, 5s, 10s, 30s, capped at 30s
5. Keep retrying until a path works or the user stops
```

While no path works, the User's state is `ADMIN_UNKNOWN` or `ADMIN_OFFLINE` and writes are refused (ADR-009). "Never drops" means *never gives up reconnecting* — it does not mean writes are queued.

### Multi-path

The app may hold several candidate paths at once (LAN, direct, punch, relay). The connection is "up" if **any** path works, and the cheapest working path is preferred: LAN before direct before punch before relay.

---

## Bidirectional communication

Both sides can initiate; WireGuard is symmetric once established.

- Admin pushes an `EventBatch` to a User
- User sends a `CommandRequest` to the Admin
- User sends a session keepalive
- Admin sends a `Purge` frame after a revocation (ADR-012)

Authorisation is independent of direction: the Admin verifies the User's membership certificate, the User verifies the Admin authority certificate (ADR-012).

---

## Key exchange

**LAN / offline pairing (no server):**
```
1. Admin displays a QR containing: project_id, Admin pubkey, virtual IP,
   local endpoint, and a short-lived pairing code
2. User scans it, sends its own pubkey + pairing code
3. Admin confirms the member (it is the authority), allocates the next
   virtual IP, and records the peer in mesh_peers
4. Both sides add each other's WireGuard public keys
5. Tunnel established
```

**Cloud-assisted enrolment (default when online):** the invitation flow in ADR-010 registers both device public keys, and the Cloud issues the membership and Admin authority certificates. Discovery then helps the two devices find each other. Keys are never transmitted through the Cloud — only public keys.

**Manual / cross-network without discovery:** the same QR exchange plus a manually entered endpoint, or a relay configuration.

QR and manual pairing are the **fallback**; discovery is the **default helper**. The mesh never depends on discovery.

---

## What we do NOT need a server for

- ❌ Assigning identity (the keypair is the identity)
- ❌ Allocating addresses (allocated locally, per project)
- ❌ Finding devices **on LAN** (mDNS, zero config)
- ❌ Authenticating connections (WireGuard keys + certificates)
- ❌ Routing traffic (the in-app stack handles it)
- ❌ Deciding permissions (the Admin decides, ADR-012)

For cross-network, discovery (ADR-020) is the default helper and QR/manual is the fallback.

## What we DO need a server for (never in the data path)

- Account management, plans, billing (ADR-014)
- Encrypted backup storage (ADR-005)
- Key escrow, **only in assisted-recovery mode** (ADR-022)
- Module registry and signing (ADR-007)
- Signed updates and typed patches (ADR-015)
- **Discovery** — endpoint metadata and hole-punch coordination (ADR-020)
- **Optional blind relay** — ciphertext forwarding, opt-in (ADR-024)
- **Self-hosted STUN / probe** — reachability self-test (ADR-019)
- Telemetry (opt-in, anonymous)

The Cloud can be down; devices keep syncing on LAN or via a relay, within the licence grace window (ADR-014).

---

## The "is it possible?" question, answered honestly

**Yes**, with precise limits.

What works:
- Stable addresses without any third party, because addresses are local to a project namespace inside the app.
- LAN operation with zero configuration and no internet.
- Cross-network operation via direct endpoints, hole-punching, or a relay.

What is **not** possible:
- A stable *public* endpoint without a static IP, reachable IPv6, port mapping, or a relay.
- Reliable traversal of **symmetric NAT / filtering CGNAT** without a relay. Hole-punching works through many NATs, not all.
- Operation with **no server anywhere**: we still run the Cloud for control-plane functions, and discovery is on by default (opt-out available).

What the customer must do:
- LAN: nothing.
- Cross-network: nothing in most cases (discovery + hole-punch). If both sides are behind filtering CGNAT: enable the blind relay (one toggle), run their own relay, or obtain a reachable endpoint from their ISP.
- Air-gapped: sneakernet, read-only.

---

## Comparison to Tailscale

Functionally similar shape. Differences that matter to us:
- They run a coordination service and DERP relays; our discovery is metadata-only and our relay is opt-in and blind.
- Their client needs a driver and admin rights on Windows; ours does not.
- Their addresses are global to a tailnet; ours are namespaced per project.
- Their pricing is per device/user on hosted plans; ours is included in the platform.

Privacy-wise we are narrower by construction: no third party, and no readable data at any hop.

---

## Enforcement

- Lint: every address-taking API takes `(project_id, virtual_ip)`. A bare-IP signature fails review.
- One tunnel instance and one local UDP port per project; a test asserts no shared socket.
- No code may add, delete or modify an OS route or install a network adapter.
- The three keepalives are separately named in code, metrics and logs.
- Sneakernet import accepts **snapshot payloads only**; any command or event submission through that path is rejected.

### Tests
- [ ] Device moves Wi-Fi → 4G: address unchanged, session resumes
- [ ] Admin with two projects: independent tunnels, no cross-talk
- [ ] User in two projects: two addresses, two tunnels, no ambiguity
- [ ] Host LAN using `10.50.x.x`: no conflict, no OS route changes
- [ ] Path failure → self-test → ladder re-walk → reconnect with backoff cap
- [ ] LAN preferred over relay when both are available
- [ ] QR pairing completes with the Cloud unreachable
- [ ] Sneakernet import of a command payload → rejected
- [ ] Packet from an unknown peer key → dropped, logged