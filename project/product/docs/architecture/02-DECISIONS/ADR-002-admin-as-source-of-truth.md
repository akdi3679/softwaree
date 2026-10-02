# ADR-002: Admin As Source Of Truth

**Status:** Accepted
**Date:** 2026-01-18
**Supersedes:** none
**Superseded by:** none

---

## Context

Two architectural shapes were possible:

1. Cloud-centric: business data lives in the Cloud, both Admin and User
   read/write through it.
2. Admin-centric: business data lives on the Admin device; the Cloud only
   holds control-plane metadata.

The customer's business data is sensitive (patient records, lab results).
The Cloud is a shared multi-tenant service. Making the Cloud authoritative
for business data would require the Cloud to have access to plaintext
business data, or to manage per-tenant encryption keys at scale.

## Decision

The Admin device is the sole source of truth for one project's business
data. The Cloud is a control plane: it knows accounts, devices, projects,
memberships, module signatures, audit hashes, and encrypted backup blobs.
It never sees business data in plaintext.

The User app holds a read-only projection of the Admin's data. Authoritative
writes always land on the Admin first.

## Consequences

Positive:

- Data ownership is explicit: the customer's device holds the truth.
- The Cloud cannot leak business data it does not possess.
- Compliance is simpler: the Cloud is out of scope for HIPAA/GDPR
  business-data processing.
- Customers who never bring the Admin online keep everything local.

Negative:

- The Admin device is a single point of failure for its project. Mitigation:
  encrypted backups to the Cloud, recovery flow.
- Offline Users cannot write. Mitigation: this is intentional (see ADR-009).
- Sync complexity: two peers must agree on ordering. Mitigation: global
  sequence per project (see ADR-004).

## Alternatives considered

**Cloud-centric.** Rejected: would require the Cloud to hold plaintext or
manage per-tenant keys, greatly expanding its threat surface.

**Hybrid: Cloud holds a replica of business data.** Rejected: violates
one-owner-per-datum (Principle 1). Any replica would eventually diverge.

## References

- docs/architecture/01-PRINCIPLES.md rules 1, 2, 3
- ADR-009-no-offline-writes-v1.md