# ADR-010: Roll-Our-Own Auth, No Keycloak / Auth0 / Clerk

**Status:** Accepted — amended 2026-11-20 (review pass 2)
**Date:** 2026-07-26
**Amended:** Authority certificate issued at project creation, not device registration. `role_ids` in certificates marked informational.
**Deciders:** Architecture team

## Context

The platform needs authentication and authorization. Off-the-shelf identity providers (Keycloak, Auth0, Clerk, WorkOS) are built primarily for web/SaaS authentication and have weak support for our "device per project" pattern.

## Decision

**We build our own auth service inside `platform-cloud/`.** It handles accounts, device keypair registry, project membership, invitations, sessions, challenge-response, and audit.

## The empty-account pattern

A user cannot self-onboard. The flow is:
1. Admin issues an invitation (email + role + module access).
2. Cloud creates an opaque, single-use token.
3. User signs up with the token and enrolls a mandatory second factor.
4. Cloud creates an **empty account** (no membership, no data, no role).
5. User app shows "Waiting for Admin".
6. Admin comes online, sees the pending user, and assigns them to a project + role + module access.
7. Cloud issues the membership certificate; Admin issues device-bound bundles.

Pending users are auto-soft-deleted after 30 days.

## Certificates and Authority

### Admin Authority Certificate

The **Admin authority certificate** is issued by the Cloud at **project creation**, not at device registration. It proves which device is the active Admin for the project.

```json
{
  "project_id": "proj_a1b2c3",
  "admin_device_pubkey": "<Ed25519 pubkey>",
  "issued_at": "2026-11-20T00:00:00Z",
  "valid_until": "2027-02-18T00:00:00Z",
  "revocation_epoch": 1,
  "cloud_signature": "base64..."
}
```

Users verify this certificate to ensure they are syncing with the legitimate Admin.

### Membership Certificates

The Cloud issues a **membership certificate** per member device:

```json
{
  "cert_id": "cert_...",
  "project_id": "proj_a1b2c3",
  "account_id": "acc_...",
  "device_pubkey": "<Ed25519 pubkey>",
  "role_ids": ["role_doctor", "role_prescriber"],  // INFORMATIONAL ONLY
  "module_access": ["medical-reception"],
  "issued_at": "2026-11-20T00:00:00Z",
  "valid_until": "2027-02-18T00:00:00Z",
  "revocation_epoch": 1,
  "cloud_signature": "base64..."
}
```

**`role_ids` are informational only.** They are included for debugging and logging, but the Admin **never trusts them for authorization decisions**. Roles change while offline, and the Cloud must not hold permission lists. The Admin enforces its own live `roles`, `role_permissions`, and `member_roles` tables (ADR-012).

### Revocation

Revocation is local and immediate. The Admin records it in `membership_certs`; it takes effect on the next operation. The Cloud's `revocation_epoch` bumps when the Admin next syncs.

## Public endpoints (auth surface)

POST /v1/accounts create account
POST /v1/accounts/sessions login (password + second factor)
POST /v1/accounts/sessions/refresh refresh session
POST /v1/accounts/sessions/revoke logout / revoke
POST /v1/accounts/mfa/enroll enroll WebAuthn or TOTP
POST /v1/devices/register register device (both public keys)
POST /v1/devices/{id}/challenge get auth challenge
POST /v1/devices/{id}/verify submit signed challenge
POST /v1/devices/{id}/replace replace device (Admin flow)
POST /v1/devices/{id}/revoke revoke device
POST /v1/projects/{id}/invitations invite user (opaque token)
POST /v1/invitations/{token}/accept accept invitation (empty account)
GET /v1/projects/{id}/memberships list memberships
POST /v1/projects/{id}/memberships Admin assigns pending user
DELETE /v1/projects/{id}/memberships/{userId} remove membership
POST /v1/projects/{id}/module-access sync coarse module-access list
GET /v1/membership-certificate this device's membership cert
GET /v1/admin-authority-certificate the project's Admin authority cert
POST /v1/recovery/initiate start recovery (ADR-022)
POST /v1/recovery/cancel customer cancels the wait
GET /v1/audit/auth auth audit log


Recovery **approval** is a staff action on `/ops/*` (ADR-013). It is deliberately unreachable from the public API.

## Cryptographic primitives

| Purpose | Algorithm |
|---|---|
| Device signing identity | **Ed25519** |
| Key agreement / wrapping | **X25519** |
| Password hashing | **Argon2id**, ≥ 64 MB memory cost |
| Customer-secret wrapping keys (recovery code, backup passphrase) | **Argon2id → HKDF-SHA-256** |
| Data encryption | **AES-256-GCM** |
| Hashing | **SHA-256** |
| Canonicalisation for signing | **JCS (RFC 8785)** |

Libraries per runtime: **Cloud (Node/TS)** `node:crypto` + `libsodium-wrappers`; **Apps (Rust)** `ring` or `aws-lc-rs`, `argon2`, `keyring`, `serde_jcs`, `zeroize`/`secrecy`. No custom crypto.

Each device generates **two** keypairs at first launch. Both private keys live in the OS keychain, non-exportable where the platform allows. A signing key cannot perform key agreement; reusing one key for two purposes is a defect, not an optimisation (ADR-022).

## Password authentication and the mandatory second factor

Email + password is allowed for account creation. Passwords are hashed with Argon2id at ≥ 64 MB.

**A second factor is mandatory on every account from v1.** WebAuthn (passkeys) preferred; TOTP is the fallback. **Password-only accounts are not permitted.** Account takeover is the shortest path to a recovery-flow attack (ADR-022), so this is not deferred.

**The account password is never used to derive project data encryption keys.** It is an unlock verifier. The only Argon2-derived *wrapping* keys come from the customer's **recovery code** or **backup passphrase** — distinct secrets, never escrowed (ADR-022 §2).

**Security questions are never accepted as proof of anything.**

## Session model — why a Cloud outage does not break the product

**Cloud sessions are short-lived (15 minutes), rolling-refreshable, and gate Cloud API calls only.** The session token is a JWT signed by the auth service; refresh tokens are server-side and revocable.

**Project operation never depends on a Cloud session.** The Admin verifies membership certificates locally against the embedded Cloud root and enforces its own live role tables. The User verifies the Admin authority certificate.

**Validity maths, stated so there is no hidden contradiction:** certificates are valid **90 days**; a licence is valid **30 days** with a **14-day** offline grace (ADR-014). The grace is always shorter than certificate validity, so during a Cloud outage the **licence state — not certificate expiry — is the binding constraint**. Certificates never silently expire out from under a working offline project. Plan 1 holds a perpetual local licence and zero Users.

## Device Authentication


Devices have their own keypair (Ed25519 + X25519), separate from the account. The flow:

1. Customer creates Admin account (email + password + mandatory second factor).
2. Customer installs Admin app.
3. Admin app generates Ed25519 + X25519 keypairs in OS keychain.
4. Admin app connects to Cloud, posts public keys + project metadata.
5. Cloud creates device record, links to account, returns device_id.
6. Device is now ACTIVE for that account.

For subsequent operations, the device signs challenges with its Ed25519 key.

## Admin Device Replacement

When the Admin's device changes:
1. Current Admin: POST /v1/devices/{id}/replace with new device's public key.
2. Cloud: marks current device as REPLACED.
3. Cloud: marks new device as ACTIVE.
4. Cloud: issues a new Admin authority certificate, bumps revocation_epoch.
5. New device: re-authenticates with account credentials **and the second factor**.
6. New device: re-downloads project data (from local cache or Cloud backup).
7. Module bundles are re-issued bound to the new device key.

If the current device is lost, the customer contacts support with proof of account ownership. Support initiates a recovery flow with stronger verification (2FA, recovery code, 48-hour wait, quorum approval — ADR-022).

## Audit

Every auth event is logged:
- Account created, login succeeded/failed, device registered/revoked, password changed, session created/expired, invitation sent/accepted, Admin device replaced.

Logs are append-only, hash-chained, and queryable by the customer (read-only) and by our team (for support).

## Enforcement
- Lint: any code path touching `accounts` or `devices` goes through the `auth` package. Direct SQL is not allowed.
- The `auth` package has 100% test coverage. Auth is too critical for partial coverage.
- **No account can be created or logged into without a verified second factor.**
- Lint: no project-operation handler may require a Cloud session token.
- Every auth event goes to the hash-chained audit log (`platform.audit.v1`, JCS), reviewed weekly.
- The Cloud's module-signing key lives in a separate process (HSM in production). **The auth service has no access to signing keys.** Compromise of auth ≠ compromise of signing.
- The patch key and the app-updater key are separate again, offline, quorum-gated (ADR-015, ADR-022).
- Invitation tokens are opaque: 256 bits CSPRNG, base32, single-use, email-bound, expiring (default 7 days). The grant lives server-side against the token record, never inside the token.
- External security audit before public launch. Budget allocated.

### Tests
- [ ] Password-only login → rejected
- [ ] Invitation token reused → rejected
- [ ] Invitation token used with a different email → rejected
- [ ] Expired invitation → rejected
- [ ] Token contains no role or permission data
- [ ] Cloud offline → Admin and User keep operating well past 15 minutes
- [ ] Membership certificate with a bad signature → refused locally
- [ ] Admin revokes a member while the Cloud is offline → denied on next operation
- [ ] Certificate `role_ids` altered → authorization decision unchanged (informational only)
- [ ] Device registers two keypairs; signing key never used for key agreement
- [ ] Replay of a signed challenge (same nonce) → rejected
- [ ] Recovery initiation triggers alerts + waiting period; no release without quorum
- [ ] Admin authority certificate issued at project creation, not at device registration

## Alternatives Considered

**Keycloak, Auth0, Clerk, WorkOS, Supabase Auth, Ory.** All rejected: OAuth/OIDC-centric, weak device-identity story, per-MAU pricing, vendor lock-in. Our auth is built around device identity and project-scoped sessions.