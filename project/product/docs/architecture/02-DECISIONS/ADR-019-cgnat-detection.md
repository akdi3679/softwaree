# ADR-019: CGNAT Detection

**Status:** Accepted
**Date:** 2026-02-24
**Supersedes:** none
**Superseded by:** none

---

## Context

Many customer networks are behind Carrier-Grade NAT (CGNAT), common on
mobile networks and some ISPs. Two devices behind CGNAT cannot accept
inbound connections, so WireGuard's usual "one side listens, the other
connects" model fails.

The mesh layer (ADR-017) tries three transports before falling back to a
customer-hosted relay. Choosing the right transport requires knowing
whether each peer is behind CGNAT, has a public IPv4, has a public IPv6,
or is on the local LAN.

## Decision

Each device reports its own network state to the discovery service on
every heartbeat (ADR-020). The state is one of:

- **lan** — a LAN-local address was found via mDNS.
- **internet** — a public IPv4 or IPv6 was observed.
- **cgnat** — a public IP was observed at the discovery service, but
  inbound connectivity to the device failed a self-test.
- **unknown** — the state could not be determined.

Detection method:

1. On startup and every 5 minutes, the device performs a
   connect-and-echo self-test against a known endpoint (the discovery
   service or a customer-hosted relay).
2. It compares its locally-observed IP (via OS interface enumeration)
   with the IP observed at the far end.
3. If they match and the far end can reach back on the observed port,
   the device is **internet**.
4. If the local IP is a private range (RFC 1918, RFC 6598) and the far
   end sees a public IP, the device is **cgnat**.

The mesh layer chooses a transport:

- If either peer is **lan** and the other is on the same LAN, use LAN.
- If either peer is **internet** and reachable, use direct internet.
- If both peers are **internet** but initial connect failed, attempt
  hole-punch.
- If either is **cgnat**, hole-punch; if that fails, use the relay.

## Consequences

Positive:

- Transport selection is data-driven and self-healing after network
  changes (mobile to Wi-Fi to tethering).
- The discovery service's heartbeat carries the state so peers can
  make the same decision without guessing.
- No customer configuration.

Negative:

- A 5-minute probe is a small background cost. Acceptable.
- The self-test endpoint becomes a soft dependency for accurate state.
  Missing it downgrades the device to **unknown**, which the mesh treats
  conservatively (attempt direct, then relay).

## Alternatives considered

**STUN-only detection.** Rejected: does not distinguish CGNAT from
symmetric NAT, and adds a STUN dependency.

**Manual customer configuration.** Rejected: no.

**Skip detection, always attempt all transports in order.** Rejected:
wastes time on every connection attempt that could have been predicted.

## References

- ADR-017-pure-local-networking.md
- ADR-020-discovery-service.md
- docs/architecture/SYNC-PROTOCOL.md