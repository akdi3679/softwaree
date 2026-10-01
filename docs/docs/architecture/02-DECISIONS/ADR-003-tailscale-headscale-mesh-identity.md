# ADR-003: ~~Tailscale + Headscale for Mesh Identity and Networking~~ (SUPERSEDED)

**Status:** ~~Accepted~~ → **Superseded** by ADR-017 (pure local networking, no third party) and ADR-018 (stable IP via private mesh)

> **This ADR is kept for historical context only. The recommended approach is now pure local networking (mDNS + WireGuard) with customer-hosted or opt-in relay for cross-network access.**

---
**Date:** 2026-07-26
**Deciders:** Architecture team

---

## Context

The platform requires:
- Every device (Cloud, Admin, User) has a stable, cryptographically-attested identity
- Admin ↔ User communication works across the public internet without exposing public IPs
- Admin ↔ User communication works on a LAN with no internet
- Discovery of other devices on the same network
- A separate, isolated network for our team's own devices (developer laptops, ops VMs)
- Self-hosted, low-cost, no vendor lock-in

## Decision

We use **Tailscale clients** on every device, controlled by a **self-hosted Headscale** server. We run **two separate tailnets**:

```
Tailnet 1: PROJECT TAILNET
  Members: every Admin device, every User device
  ACL:    Admin ↔ User allowed, User ↔ User denied, Admin ↔ Admin denied
           Cloud services get device-tag ACLs to specific Admin devices only

Tailnet 2: OPERATIONS TAILNET
  Members: developer laptops, ops VMs, build runners, monitoring
  ACL:    strict, only what each role needs
  Contains: Headscale control server, Cloud VMs, internal services
```

The two tailnets **never overlap**. A device in the Project Tailnet cannot address a device in the Operations Tailnet and vice versa.

### Why two tailnets, not one

The Operations tailnet holds our signing keys, our CI runners, our internal monitoring. If an Admin device is ever compromised, the attacker is on the Project Tailnet, which has no route to Operations. The blast radius is contained.

### Why Headscale, not Tailscale's hosted control plane

- Self-hosted, no per-device fees
- Full control of node registration, ACLs, audit
- Operates on a single binary (Go) we can run on the same VM as the Cloud API initially
- BSD-3 licensed, community-maintained, Tailscale-compatible
- Migration to Tailscale's hosted control plane (or back) is one config change

### Why Tailscale clients

- Stable device IPs (`100.x.y.z`) that survive reboot, network change, ISP switch — confirmed by Tailscale's own docs and real-world usage
- Built-in NAT traversal via DERP relays when direct P2P fails
- WireGuard under the hood — state of the art
- MagicDNS for name-based addressing (no one needs to remember IPs)
- Cross-platform: Windows, macOS, Linux, iOS, Android — all the platforms our Admin/User apps will target
- ACLs enforced at the coordination server level, not at each device

### Why NOT IP rotation as a "security feature"

Tailscale IPs are on a private network. They are not reachable from the public internet. "Rotating" them provides no security benefit — they cannot be discovered or attacked from outside the tailnet. Rotation would only add complexity (clients must re-resolve, sessions break, ACLs churn).

## Consequences

### Positive

- **Stable device identity.** Each device has a `100.x.y.z` IP that lasts years. Admin replacement is the only thing that changes a device's IP.
- **No port forwarding, no firewall holes.** WireGuard tunnels are outbound-initiated.
- **LAN / no-internet works.** When two devices are on the same LAN, Tailscale uses direct peer-to-peer over the local network — no DERP, no internet needed.
- **mDNS on top of Tailscale.** For LAN discovery, we layer mDNS broadcast so a User can find the Admin in <1s when on the same Wi-Fi, even if the Tailscale daemon is just starting.
- **Self-hosted control plane.** No per-device cost scales linearly. We pay for our ops VM, not for the privilege of running our own mesh.
- **Cross-platform.** Same client on every device.

### Negative

- **Tailscale client must be installed** on every Admin and User device. Acceptable — installation is part of the app bootstrap, automatic, transparent to the user.
- **One more dependency.** We mitigate by pinning the Tailscale version and using the official client (not a fork).
- **Headscale ops burden.** Small — one binary, one config file, runs alongside the Cloud.

### Neutral

- We do not need IPv6 for v1. Tailscale provides both, but our discovery and address scheme use IPv4 (`100.x.y.z`).

## Alternatives Considered

### WireGuard directly (no Tailscale, no Headscale)

**Pros:** full control, no external dependency.
**Cons:** we hand-roll device registration, key rotation, NAT traversal, discovery, ACLs. We are reinventing Tailscale. Bad ROI.
**Rejected because:** Tailscale does this better than we would in v1.

### Tailscale's hosted control plane

**Pros:** zero ops, professional support, easy.
**Cons:** per-device fees scale with our growth; vendor lock-in; our device registry is held by a third party.
**Rejected because:** we want self-hosted control. We can migrate to Tailscale's hosted later if we change our mind.

### ZeroTier

**Pros:** similar to Tailscale, also self-hostable (`ztncui`).
**Cons:** smaller community, fewer integrations, less mature MagicDNS.
**Rejected because:** Tailscale + Headscale has the larger ecosystem, the better client UX, and the clearer roadmap.

### Plain HTTPS with mutual TLS

**Pros:** boring, well-understood.
**Cons:** no NAT traversal, no LAN discovery, every device needs a public IP or a relay. Doesn't solve the "no internet" case.
**Rejected because:** it doesn't meet the user's "Wi-Fi with no internet" requirement.

## Enforcement

- Every device must authenticate to the tailnet using a Tailscale auth key issued by the Cloud, not by a human. Keys are tagged with the device's role (`tag:admin`, `tag:user`, `tag:cloud`).
- ACLs are stored in Headscale's config file, version-controlled in `internal-infra/`. Any ACL change is a PR.
- Device registration in the Cloud only succeeds after the Tailscale auth is confirmed. A device cannot join a project without a valid tailnet node.
- The Operations tailnet config and the Project tailnet config live in separate Headscale instances, on separate VMs (or at least separate processes with separate data directories).
