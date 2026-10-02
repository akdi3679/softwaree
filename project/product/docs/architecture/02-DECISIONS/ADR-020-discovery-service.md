# ADR-020: Discovery Service

**Status:** Accepted
**Date:** 2026-02-26
**Supersedes:** none
**Superseded by:** none

---

## Context

Admin and User devices move between networks. They need a way to find
each other's current real endpoint (IP + port), but the Cloud must never
see sync traffic, and customers who want no Cloud involvement at all
must be able to opt out.

Options:

1. No discovery. Peers rely on LAN or a customer-hosted relay.
2. A public discovery service that maps virtual IP -> current endpoint.
3. Peer-to-peer discovery via DHT.

## Decision

Option 2: a minimal discovery service on the Cloud.

**What it stores:** `device_id`, `virtual_ip`, `current_public_ip`,
`current_public_port`, `current_ipv6`, `state` (from ADR-019), and
`last_seen_at`.

**What it does not store:** message contents, peer-to-peer topology,
"who is talking to whom", device names, customer names, or any business
data. A row contains only what is needed to answer "where is virtual IP
X?" and nothing else.

**Endpoints:**

    POST /v1/discovery/heartbeat
      Body: {device_id, virtual_ip, current_public_ip, current_public_port,
             current_ipv6, state, reachable_methods, timestamp}
      Cadence: every 60 seconds.
      Response: {ok: true, next_heartbeat_seconds: 60}

    GET  /v1/discovery/lookup?virtual_ip=10.50.0.1
      Response:
        200 {device_id, virtual_ip, current_public_ip, current_public_port,
             current_ipv6, state, reachable_methods, last_seen_at}
        404 {error: "not_found"} | {error: "stale"}

**Staleness:** 30 minutes. Lookups older than 30 minutes return `stale`
and the caller must fall back to hole-punching or the relay.

**Retention:** 7 days. Rows older than 7 days are deleted by a
background job. A device that has not sent a heartbeat in 7 days is
"forgotten".

**Opt-out:** a customer can disable discovery for a project. In that
mode, devices never send heartbeats, and lookups for those virtual IPs
return 404. The customer must rely on LAN or the customer-hosted relay.

## Consequences

Positive:

- Peers can find each other across arbitrary networks without a
  peer-to-peer protocol.
- The stored data is minimal and non-sensitive.
- Opt-out keeps the privacy-conscious customer path viable.

Negative:

- The discovery service becomes a soft dependency for cross-network
  sync. When it is down, LAN sync still works, and the relay still
  works. Only the "both sides on the open internet" path degrades.
- The Cloud sees device public IPs. This is a deliberate trade (see
  docs/architecture/SYNC-PROTOCOL.md "Privacy" section). Opt-out is
  available.

## Alternatives considered

**No discovery.** Rejected: makes WAN sync impossible without a relay.

**Peer-to-peer DHT.** Rejected: adds an unauthenticated global surface,
harder to audit, no clear privacy improvement over a scoped registry.

**Blind relay through the Cloud.** Rejected: puts us in the data path,
which ADR-017 forbids.

## References

- platform-cloud/apps/api/src/discovery/index.ts
- docs/architecture/SYNC-PROTOCOL.md
- ADR-017-pure-local-networking.md
- ADR-018-stable-ip-mesh.md
- ADR-019-cgnat-detection.md