# ADR-010: Roll Our Own Auth

**Status:** Accepted
**Date:** 2026-02-15
**Supersedes:** none
**Superseded by:** none

---

## Context

The Cloud needs to authenticate three kinds of principal:

- **Accounts** (customers) at signup/login.
- **Devices** (Admin and User apps) presenting a hardware-backed key.
- **Sessions** carrying an authenticated user + device context.

Options:

1. Use a third-party identity provider (Auth0, Clerk, WorkOS, Cognito).
2. Use an open-source auth server (Keycloak, Zitadel, Authelia).
3. Build a minimal auth service tailored to our model.

## Decision

Option 3: build our own, deliberately minimal.

Concretely:

- Passwords hashed with **Argon2id** (via `@node-rs/argon2`), memory 64 MiB,
  time cost 3, parallelism 4.
- Device keys are **Ed25519**, generated on the device, kept in the OS
  keychain. The Cloud stores only the public key.
- Sessions are opaque random tokens; only a SHA-256 hash is stored on the
  Cloud. TTL 30 days; rotated on sensitive events (role change, password
  change, device replacement).
- Brute-force lockout: 5 failed attempts per (email, IP) in 30 minutes.
- Two-factor (TOTP) planned for v1.1, not v1.

## Consequences

Positive:

- No vendor dependency, no per-user cost, no data-residency questions.
- We control the threat model end-to-end. Every line is auditable.
- Fits the device-key model: sessions are bound to a device that
  presented a key, not just to a bearer token.

Negative:

- We own the security surface. Mitigation: pen-test, external review,
  no custom cryptography (all primitives from well-audited libraries).
- No out-of-the-box SSO/SAML. Not needed for v1 (single-tenant
  customers, small teams).

## Alternatives considered

**Auth0 / Clerk / WorkOS.** Rejected: per-user cost, data leaves our
infra, vendor lock-in.

**Keycloak.** Rejected: heavy Java service, overkill for our model, adds
an operational burden.

**Authelia.** Rejected: designed for a reverse-proxy front, not for
device-key auth or per-session role management.

## References

- platform-cloud/apps/api/src/crypto/password.ts
- platform-cloud/apps/api/src/crypto/device-key.ts
- platform-cloud/apps/api/src/auth/brute_force.ts
- platform-cloud/apps/api/src/auth/session-rotation.ts
- docs/architecture/01-PRINCIPLES.md rule 7