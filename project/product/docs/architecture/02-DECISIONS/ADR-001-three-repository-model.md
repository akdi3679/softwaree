# ADR-001: Three-Repository Model

**Status:** Accepted
**Date:** 2026-01-15
**Supersedes:** none
**Superseded by:** none

---

## Context

The platform has three distinct audiences with different access needs:

- Customers install desktop apps (Admin, User).
- Our team operates the Cloud control plane.
- Our ops team runs the infrastructure (CI, secrets, monitoring).

A single monorepo would force everyone to see everything. Contractors
and future open-source contributors would see Cloud internals. A single
leak of the Cloud schema would weaken the whole system.

## Decision

Split into three independent repositories:

    internal-infra/    private, ops only
    platform-cloud/    private, our team
    product/           commercial, ships to customers

They do not share code, CI, or deployment infra. They communicate only
through the versioned Cloud API contract published as a TypeScript
package.

## Consequences

Positive:

- Access control: contractors see only product/.
- Blast radius: an accidental import cannot leak Cloud internals into the app.
- Lifecycle: product ships weekly, Cloud deploys internally, infra rarely.
- Compliance: platform-cloud/ is a self-contained audit surface.

Negative:

- Contract drift is possible. Mitigation: the contract is a versioned
  TypeScript package with its own CI.
- Two repos to keep in sync when the API changes. Mitigation: semver +
  deprecation windows.
- Local dev requires two clones side-by-side. Mitigation: documented layout.

## Alternatives considered

**Monorepo.** Rejected: too hard to enforce the access boundary. A single
accidental import would be a compliance violation.

**Two repos (product + everything-else).** Rejected: ops infra has a
fundamentally different lifecycle and audience than the Cloud API.

## References

- docs/architecture/00-OVERVIEW.md section 2
- docs/architecture/01-PRINCIPLES.md rule 12