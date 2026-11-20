# ADR-010: Roll-Our-Own Auth, No Keycloak / Auth0 / Clerk

**Status:** Accepted — amended 2026-11-20
**Date:** 2026-07-26
**Amended:** 2026-11-20 — mandatory second factor, opaque invitation tokens, membership certificates (fixes Cloud-offline operation), correct crypto libraries per runtime, X25519 in v1, endpoint corrections, recovery hardened per ADR-022
**Deciders:** Architecture team
**See also:** ADR-012 (permissions + certificates), ADR-013 (owner console), ADR-014 (licensing), ADR-022 (key custody + recovery)

---

## Context

The platform needs authentication and authorisation. Do we use an off-the-shelf identity provider (Keycloak, Auth0, Clerk, WorkOS) or build our own?

Our requirements are unusual:

- Account-level identity (Cloud-managed)
- Device-level identity (cryptographic keypairs per device)
- Project membership (Cloud-managed)
- Project-level roles and permissions (Admin-managed)
- Admin device authority (one per project)
- Admin device replacement (Cloud-mediated)
- Challenge-response authentication, not password-based
- Mutual authentication
- **Continued project operation while the Cloud is offline**
- No traditional web login flow — this is a desktop app

Off-the-shelf providers are built for web/SaaS: email + password, OAuth, social login, SAML, OIDC. They model "device per project" poorly and would need heavy customisation.

---

## Decision

**We build our own auth service inside `platform-cloud/`.** A focused ~3,000-line TypeScript service handling:

- Account CRUD (email + password **plus a mandatory second factor**)
- Device keypair registry (two keypairs per device)
- Project membership
- Invitation tokens (opaque, single-use, email-bound, expiring)
- Session issuance (short-lived, refreshable) — **for Cloud API calls only**
- **Membership certificates and Admin authority certificates** — long-lived, locally verifiable
- Challenge-response for device operations
- Audit log of auth events

We do not use Keycloak, Auth0, Clerk, WorkOS, Firebase Auth, or any other auth-as-a-service product.

---

## Consequences

### Positive
- **Fits the model exactly.** Devices, projects and roles are native concepts, not mappings onto OAuth abstractions.
- **Smaller attack surface.** ~3,000 lines of focused TypeScript we can audit. Keycloak is a 500 MB Java application.
- **No vendor lock-in.** Auth is the most critical component; owning it means we can change anything.
- **No per-user fees.** Auth0/Clerk charge per MAU. At a million users that is a real cost.
- **Faster iteration.** A new auth feature is one PR.
- **Better security model.** Device identity, mutual authentication, command signing and per-project binding are native.
- **Cloud-offline operation works.** Certificates are verified locally by the Admin, so a Cloud outage does not lock everyone out after 15 minutes.

### Negative
- **We own the security burden.** Every vulnerability is ours. Security review, fuzzing and audit are mandatory line items, not optional.
- **No free features.** Social login, SAML and OIDC would have to be built if ever needed.
- **We must contract security expertise.** "We rolled our own auth" without external review is a disaster.
- **No production track record on day one.** Mitigated by an audit before launch, a conservative feature set, and extensive testing.
- **More code to maintain.** ~3,000 lines replaces a 500 MB Java app. Favourable trade.

### Neutral
- We may open-source the service later. Not a v1 priority.

---

## Auth service architecture

```
platform-cloud/
├── packages/
│   ├── auth/
│   │   ├── src/
│   │   │   ├── account.ts
│   │   │   ├── mfa.ts
│   │   │   ├── device.ts
│   │   │   ├── session.ts
│   │   │   ├── invitation.ts
│   │   │   ├── challenge.ts
│   │   │   ├── membership.ts      ← membership + admin authority certificates
│   │   │   ├── recovery.ts        ← initiation only; approval lives in /ops (ADR-013)
│   │   │   └── audit.ts
│   │   ├── schema.sql
│   │   └── tests/
│   └── ...
└── apps/
    └── api/                       ← Hono API, imports the auth package
```

### Public endpoints (auth surface)

```
POST   /v1/accounts                                  create account
POST   /v1/accounts/sessions                         login (password + second factor)
POST   /v1/accounts/sessions/refresh                 refresh session
POST   /v1/accounts/sessions/revoke                  logout / revoke
POST   /v1/accounts/mfa/enroll                       enroll WebAuthn or TOTP
POST   /v1/devices/register                          register device (both public keys)
POST   /v1/devices/{id}/challenge                    get auth challenge
POST   /v1/devices/{id}/verify                       submit signed challenge
POST   /v1/devices/{id}/replace                      replace device (Admin flow)
POST   /v1/devices/{id}/revoke                       revoke device
POST   /v1/projects/{id}/invitations                 invite user (opaque token)
POST   /v1/invitations/{token}/accept                accept invitation (empty account)
GET    /v1/projects/{id}/memberships                 list memberships
POST   /v1/projects/{id}/memberships                 Admin assigns pending user to project + role
DELETE /v1/projects/{id}/memberships/{userId}        remove membership
POST   /v1/projects/{id}/module-access               Admin syncs the coarse module-access list
GET    /v1/membership-certificate                    fetch this device's membership certificate
GET    /v1/admin-authority-certificate               fetch the project's Admin authority certificate
POST   /v1/recovery/initiate                         start account/Admin recovery (ADR-022)
GET    /v1/audit/auth                                auth audit log
```

Recovery **approval** is a staff action and lives on the private channel `/ops/*` (ADR-013). It is deliberately not reachable from the public API.

---

## The empty-account pattern

Per the user's goal: *"he can let user to added by make them signup on the signup page but with id of this user becayse its created as empty, then if pc admin open or live it will receive the data."*

A user cannot self-onboard.

1. Admin issues an invitation. The token is **opaque** (256 bits of CSPRNG entropy, base32-encoded), **single-use**, **bound to the invited email address**, and **expires** (default 7 days). The pre-granted role and module access are stored **server-side against the token record** — never encoded inside the token.
2. User opens the signup page and enters the token.
3. Cloud validates: token exists, unused, unexpired, email matches. It creates an **empty account** — credentials plus a mandatory second factor, no project membership, no data, no role.
4. The account sits in `pending_pickup`.
5. When the Admin is online it shows "1 new user waiting to be assigned".
6. Admin assigns project + role + module access (defaulting to the invitation's stored values).
7. Cloud issues the membership certificate; the Admin issues the device-bound module bundles (ADR-007). The User app leaves "Waiting for Admin" and shows the project.

During `pending_pickup` the User can see nothing. The Cloud enforces this in middleware (no project-scoped calls). The User app enforces it in the UI (only the waiting screen).

Pending accounts are auto-soft-deleted after 30 days; the Cloud's `corbeille_audit` records it.

**Why opaque tokens:** a token that encodes role data is a bearer credential carrying its own authority. Anyone who sees it learns the grant, and tampering becomes an attack surface. An opaque, single-use, email-bound, expiring pointer to server-side state has none of those properties.

---

## Cryptographic primitives

| Purpose | Algorithm |
|---|---|
| Device signing identity | **Ed25519** |
| Key wrapping (module content keys) and future E2E | **X25519** |
| Password hashing | **Argon2id** (≥ 64 MB memory cost) |
| Password-derived wrapping key (device replacement, recovery codes) | **Argon2id** → HKDF-SHA-256 |
| Data encryption | **AES-256-GCM** |
| Hashing | **SHA-256** |
| Canonicalisation for signing | **JCS (RFC 8785)** |

Libraries, per runtime:
- **Cloud (Node/TypeScript):** `node:crypto` and `libsodium-wrappers`.
- **Apps (Rust):** `ring` or **`aws-lc-rs`**, and `serde_jcs` for canonical JSON.

No custom crypto. Standard libraries, standard algorithms, no cleverness.

**Each device generates two keypairs at first launch:**
- **Ed25519** — signing identity. Never used for encryption or key derivation.
- **X25519** — encryption. Receives wrapped module Content Keys (ADR-007, ADR-011).

Both public keys are registered. Both private keys live in the OS keychain and are non-exportable where the platform allows it. A signing key cannot perform key agreement, and reusing one key for two purposes is a defect, not an optimisation (ADR-022).

---

## Session model — and why the Cloud going down no longer breaks the product

**Cloud sessions are short-lived (15 minutes), refreshable (rolling), and gate Cloud API calls only.** The session token is a JWT signed by the auth service. Refresh tokens are stored server-side and revocable.

**Project operation never depends on a Cloud session.** At enrolment the Cloud signs two long-lived certificates:

### Membership certificate (one per member device)

```
{
  cert_id, project_id, account_id, device_pubkey,
  role_ids: [...], module_access: [...],
  issued_at, valid_until,          // 90 days
  revocation_epoch,
  cloud_signature                   // Ed25519, chains to the embedded root
}
```

### Admin authority certificate (one per project)

```
{
  project_id, admin_device_pubkey,
  issued_at, valid_until,          // 90 days
  revocation_epoch,
  cloud_signature
}
```

Verification is local:
- The **Admin** verifies each User's membership certificate against the embedded Cloud root, then enforces the current role/permission tables it owns.
- The **User** verifies the Admin authority certificate, so it knows it is talking to the real Admin and not an impostor on the mesh.

Revocation:
- The **Admin revokes locally and immediately** — it is the project authority. The local revocation is recorded in `membership_certs` and takes effect on the next operation (Principle 5).
- The Cloud's `revocation_epoch` bumps when the Admin next syncs, and at that point the Cloud stops issuing certificates for the revoked member.

Validity maths, stated so there is no hidden contradiction: certificates are valid 90 days; a licence is valid 30 days with a 14-day offline grace (ADR-014). **The licence grace is always shorter than certificate validity**, so during a Cloud outage the licence state — not certificate expiry — is the binding constraint. Certificates never silently expire out from under a working offline project.

Plan 1 is the exception: a perpetual local licence, zero Users, no Cloud dependency after activation (ADR-014, ADR-023).

---

## Password authentication (account level)

Email + password is allowed for account creation, primarily so a customer can set up their first Admin account. Passwords are hashed with Argon2id at a high memory cost (64 MB+).

**A second factor is mandatory on every account from v1.** WebAuthn (passkeys) is preferred; TOTP is the fallback for devices without WebAuthn. Password-only accounts are not permitted. Account takeover is the shortest path to a recovery-flow attack (ADR-022), so this is not optional and not deferred to v1.1.

**The account password is never used to derive project data encryption keys.** Authentication and encryption are separate concerns. The only password-derived *wrapping* key is the optional local unlock/replacement wrapper described in ADR-005 and ADR-022, and it wraps a randomly generated key rather than being the key itself.

---

## Device authentication

```
1. Customer creates an Admin account (email + password + second factor)
2. Customer installs the Admin app
3. App generates Ed25519 + X25519 keypairs in the OS keychain
4. App connects to the Cloud, posts both public keys + project metadata
5. Cloud creates the device record, links it to the account, returns device_id
6. Cloud issues the Admin authority certificate
7. Device is ACTIVE for that account
```

Subsequent operations:

```
1. Device → Cloud: "I want to do operation X"
2. Cloud → Device: "Sign this challenge with your private key"
3. Device → Cloud: signed challenge (timestamp + nonce bound into the payload)
4. Cloud verifies the signature, rejects replays
5. Cloud checks: device ACTIVE? account in good standing? authorised for X?
6. Cloud returns the result or a typed error
```

Mutual authentication (Cloud → device) is via TLS with certificate pinning to our CA. The device does not accept a Cloud certificate merely because a public CA issued it.

---

## Admin device replacement

```
1. Current Admin: POST /v1/devices/{id}/replace with the new device's public keys
2. Cloud marks the current device REPLACED
3. Cloud marks the new device ACTIVE
4. Cloud issues a new Admin authority certificate and bumps revocation_epoch
5. Cloud re-issues module bundles bound to the new device (ADR-007)
6. New device authenticates with account credentials + second factor
7. New device restores project data from the latest backup (ADR-022) or a local copy
8. Users verify the new Admin authority certificate and resync
```

If the current device is lost, the customer contacts support. **Recovery follows ADR-022, not a conversation:**

- Re-authentication with the account's second factor (hardware key preferred)
- A mandatory **waiting period** (default 48 hours)
- **Out-of-band alerts to every contact on the account**, with a cancel link
- **Two-staff approval** for any escrow key release
- A complete, hash-chained audit trail
- In zero-knowledge mode there is no escrow: the customer's recovery code is the only path

**Security questions are never accepted as proof of anything.** They are the weakest link in every account-takeover story, and they are not part of this system.

---

## Audit

Every auth event is logged: account created, login succeeded/failed, second factor enrolled/changed, device registered, device revoked, password changed, session created/expired, invitation sent/accepted/expired, membership granted/revoked, certificate issued, Admin device replaced, recovery initiated/approved/denied.

Logs are append-only, hash-chained (`platform.audit.v1`, JCS — Principle 11), queryable read-only by the customer, and queryable by our staff through the private channel with every access itself audited (ADR-013).

---

## What we deliberately do not build in v1

- **OAuth / OIDC provider.** We are not a general identity provider.
- **Social login.** Customer accounts are for our customers, not the general public.
- **SAML / SSO.** Possible enterprise requirement later. Not v1.
- **TOTP as the primary factor.** WebAuthn is preferred; TOTP ships in v1 only as the fallback second factor.
- **Self-service account deletion.** Soft-delete + hard-delete exists, but it is a support action in v1 (ADR-013, ADR-016).

---

## Alternatives Considered

### Keycloak
**Pros:** mature, feature-complete, open source.
**Cons:** Java + 500 MB runtime; OAuth/OIDC-centric; weak device-identity story; we would need a parallel device-auth service anyway.
**Rejected:** mapping our model onto Keycloak's abstractions is a permanent translation tax.

### Auth0
**Pros:** mature, well supported.
**Cons:** per-MAU pricing scales badly; vendor lock-in; OAuth-centric.
**Rejected:** pricing at scale, and we do not need OAuth flows.

### Clerk
**Pros:** great DX.
**Cons:** same pricing and lock-in issues.
**Rejected for the same reasons.**

### WorkOS
**Pros:** enterprise SSO focus.
**Cons:** SSO is not our v1 use case.
**Rejected:** we are not building enterprise SSO in v1.

### Supabase Auth
**Pros:** open source, bundles Postgres.
**Cons:** tied to the Supabase platform; OAuth-centric; weak device identity.
**Rejected:** we already run our own Postgres + Drizzle.

### Ory (Kratos + Hydra)
**Pros:** flexible, open source.
**Cons:** still OIDC-centric; device identity would be built on top; operational cost similar to our own focused service.
**Rejected:** marginal value over a focused in-house service.

---

## Enforcement

- Lint rule: any code touching `accounts` or `devices` goes through the `auth` package. Direct SQL is not allowed.
- The `auth` package has 100% test coverage. Auth is too critical for partial coverage.
- External security audit before public launch. Budget allocated.
- Every auth event goes to the hash-chained audit log, reviewed weekly.
- The Cloud's module-signing key lives in a separate process (and in production an HSM). **The auth service has no access to signing keys.** Compromise of auth does not equal compromise of signing.
- The patch-signing key is separate again, offline, with two-person approval (ADR-015).
- No account can be created or logged into without a verified second factor.

### Tests
- [ ] Password-only login rejected
- [ ] Invitation token reused → rejected
- [ ] Invitation token used with a different email → rejected
- [ ] Expired invitation → rejected
- [ ] Token contains no role or permission data (opaque)
- [ ] `GET /memberships` works; the old duplicate `POST` for listing is gone
- [ ] Cloud taken offline → Admin + User keep operating well past 15 minutes
- [ ] Membership certificate with a bad signature → refused locally
- [ ] Admin revokes a member while the Cloud is offline → access denied immediately
- [ ] Device registers two keypairs; signing key never used for key agreement
- [ ] Recovery initiation triggers alerts + waiting period; no release without two staff
- [ ] Replay of a signed challenge (same nonce) → rejected