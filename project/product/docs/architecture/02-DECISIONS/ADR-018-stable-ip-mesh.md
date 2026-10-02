# ADR-018: Stable Virtual IPs

**Status:** Accepted
**Date:** 2026-02-22
**Supersedes:** none
**Superseded by:** none

---

## Context

An Admin's real IP address changes constantly (home network, tethering,
CGNAT). The User must be able to address the Admin as a stable endpoint
regardless of what network either device is on.

Options:

1. Address peers by hostname resolved via the discovery service every
   time. Adds a Cloud round-trip on every connection.
2. Address peers by a stable virtual IP that the mesh layer resolves to a
   real endpoint under the hood.
3. Address peers by role (ADMIN, USER-1, USER-2) and let the app resolve.

## Decision

Option 2. Every device is assigned a stable virtual IP from the
`10.50.0.0/16` range, per project:

    Admin     10.50.0.1
    User 1    10.50.0.2
    User 2    10.50.0.3
    User N    10.50.0.(N+1)

The virtual IP is assigned when the device is registered with the project
and never changes for the lifetime of the device within that project. The
`/16` range gives 65,534 addresses per project, which is far more than
any real customer will use in v1.

The application layer uses only virtual IPs. The mesh layer maps virtual
IP -> real endpoint at connect time (see ADR-017). Virtual IPs are
carried in the discovery service's heartbeat and lookup (ADR-020).

## Consequences

Positive:

- Application code never deals with changing real IPs.
- Firewall rules and mesh ACLs are per-virtual-IP, which is stable and
  easy to reason about.
- The discovery service's job is minimal: it maps a virtual IP to a
  current real endpoint, and forgets it after 7 days.

Negative:

- A customer migrating to a different mesh (self-hosted relay) must
  keep the same virtual IP space. This is fine: `10.50.0.0/16` is a
  private range under our control.

## Alternatives considered

**Role-based addressing only.** Rejected: does not compose with mesh ACLs
or metrics per device.

**DNS-based resolution every connect.** Rejected: extra latency; a
Cloud round-trip becomes a hard dependency for LAN-local sync.

**Derive virtual IP from device public key.** Rejected: collisions in a
`/16`. Sequential assignment is simpler and auditable.

## References

- docs/architecture/SYNC-PROTOCOL.md
- ADR-020-discovery-service.md