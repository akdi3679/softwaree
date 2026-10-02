# ADR-003: Tailscale / Headscale Mesh Identity

**Status:** SUPERSEDED
**Date:** 2026-01-22
**Superseded by:** ADR-017, ADR-018, ADR-019, ADR-020

---

## Note

This ADR originally proposed using Tailscale (or a self-hosted Headscale
equivalent) as the mesh identity layer between Admin and User devices.

It was superseded during the networking review.

## Why it was superseded

Three concerns with Tailscale / Headscale:

1. **Third-party dependency.** Even self-hosted Headscale inherits a
   protocol and control-plane design we do not own. A protocol-level
   issue would be out of our control.
2. **Discovery metadata.** Headscale would learn device locations. We
   wanted to design our own minimal discovery surface (ADR-020) so we
   can make it opt-outable.
3. **Onboarding friction.** A Tailscale account or Headscale auth flow
   would be required of every customer. We wanted zero-friction LAN
   pairing with optional WAN.

The replacements:

- ADR-017: pure local networking (our own mesh)
- ADR-018: stable virtual IPs in 10.50.0.0/16
- ADR-019: CGNAT detection
- ADR-020: discovery service

## Consequences

None. This ADR carries no decisions.

## References

- ADR-017-pure-local-networking.md
- ADR-018-stable-ip-mesh.md
- ADR-019-cgnat-detection.md
- ADR-020-discovery-service.md