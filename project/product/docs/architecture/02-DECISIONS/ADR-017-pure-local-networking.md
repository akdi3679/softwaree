# ADR-017: Pure Local Networking

**Status:** Accepted
**Date:** 2026-02-20
**Supersedes:** ADR-003
**Superseded by:** none

---

## Context

Admin and User devices must exchange sync traffic. In v1, the mesh was
going to be Tailscale (or Headscale). ADR-003 documented that choice;
ADR-003 was later superseded because of three concerns:

1. Third-party dependency on a protocol we do not control.
2. Discovery metadata would leak through Headscale.
3. Onboarding friction for LAN-only customers.

The requirement: a mesh that works on LAN with zero configuration, works
on WAN when both devices have reachable addresses, and never puts our
Cloud in the data path.

## Decision

Build our own minimal mesh, no third-party VPN. Four transport methods,
tried in order:

1. **Direct LAN** — mDNS to find the peer, WireGuard over the local link.
2. **Direct internet** — WireGuard over IPv6 or static IPv4, using a
   cached last-known endpoint.
3. **NAT traversal** — outbound-initiated hole-punch (WireGuard with
   simultaneous-open), coordinated by the discovery service (ADR-020).
4. **Customer-hosted relay** — a WireGuard endpoint on hardware the
   customer owns.

WireGuard provides E2E encryption, forward secrecy (keys rotate every
2 minutes), and replay protection. mDNS (RFC 6762) provides LAN discovery
with no server.

The application layer addresses peers by their **stable virtual IP**
(ADR-018), never by their real IP. Transport selection is a runtime
decision inside the mesh layer.

## Consequences

Positive:

- No third-party protocol in the trust path.
- LAN-only customers never contact any Cloud endpoint.
- WireGuard is in the kernel on Linux, and available as a userspace
  implementation on Windows and macOS. Battle-tested cryptography.

Negative:

- We implement hole-punching ourselves. Complexity lives in the mesh
  layer, but is bounded by existing WireGuard tooling.
- NAT traversal does not work in every network. When all three attempts
  fail, the customer-hosted relay is the fallback, and when that is
  unavailable, sync pauses (see ADR-009).

## Alternatives considered

**Tailscale.** Rejected: see ADR-003 supersession reasons.

**Headscale (self-hosted Tailscale).** Rejected: same protocol-level
concerns; also forces customers to run a Tailscale-compatible client.

**Direct HTTP over LAN, no VPN.** Rejected: no E2E encryption outside
the LAN; would need to layer TLS on top with our own PKI.

**Customer-hosted relay only.** Rejected: high latency on LAN,
unnecessary for co-located devices.

## References

- ADR-018-stable-ip-mesh.md
- ADR-019-cgnat-detection.md
- ADR-020-discovery-service.md
- apps/admin/src-tauri/src/sync/mdns.rs
- docs/architecture/SYNC-PROTOCOL.md