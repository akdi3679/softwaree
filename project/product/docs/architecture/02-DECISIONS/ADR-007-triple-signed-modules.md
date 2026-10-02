# ADR-007: Triple-Signed Modules

**Status:** Accepted
**Date:** 2026-02-05
**Supersedes:** none
**Superseded by:** none

---

## Context

Modules are code that runs inside customer devices with elevated access.
Three separate trust questions must be answered before a module is
allowed to execute:

1. **Is this module really from the platform owner?** (Authorship)
2. **Is this module licensed for this project and plan?** (Entitlement)
3. **Is this module being loaded on the device it was licensed for?**
   (Binding)

A single signature cannot answer all three because each is issued by a
different authority at a different time.

## Decision

Every module package carries three independent signatures:

- **Cloud root signature.** Issued at publish time by the platform root
  key. Proves authorship.
- **Project license signature.** Issued when a project installs the
  module. Binds the module ID + version + project ID + plan ID.
- **Device bind MAC.** Issued when the module is installed on a specific
  device. Binds the module + device.

At load time the Admin verifies all three. If any fails, the module is
rejected and the attempt is audited.

## Consequences

Positive:

- A stolen module package is useless without a license.
- A copied license is useless on a different device.
- The Cloud can revoke a device binding without rotating the root key.
- Compliance: we can prove that a module was licensed for a specific
  project.

Negative:

- More bytes in the manifest. Acceptable.
- The Cloud must be reachable at install time to issue the license
  (or a pre-issued license must be cached). Mitigation: licenses are
  short and cached; install is an online operation by design.

## Alternatives considered

**Single Cloud signature only.** Rejected: would let any customer run any
module they obtained.

**License + device bind, no root signature.** Rejected: a malicious
customer could issue licenses for tampered modules.

**JWT-based licensing.** Rejected: no offline verification; expiry logic
would need a revocation channel.

## References

- docs/architecture/01-PRINCIPLES.md rule 8
- apps/admin/src-tauri/src/modules/verify.rs