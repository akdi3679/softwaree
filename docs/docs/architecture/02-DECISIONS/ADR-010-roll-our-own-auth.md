# ADR-010: Roll-Our-Own Auth, No Keycloak / Auth0 / Clerk

**Status:** Accepted
**Date:** 2026-07-26
**Deciders:** Architecture team

---

## Context

The platform needs authentication and authorization. The natural question is: do we use an off-the-shelf identity provider (Keycloak, Auth0, Clerk, WorkOS) or build our own?

Our auth requirements are unusual:
- Account-level identity (Cloud-managed)
- Device-level identity (cryptographic keypair per device)
- Project membership (Cloud-managed)
- Project-level roles and permissions (Admin-managed)
- Admin device authority (one per project)
- Admin device replacement (Cloud-mediated)
- Challenge-response authentication, not password-based
- Mutual authentication (both sides prove identity)
- No web login flow in the traditional sense (this is a desktop app, not a website)

Off-the-shelf identity providers are built primarily for web/SaaS authentication: email + password, OAuth, social login, SAML, OIDC. They have weak support for "device per project" patterns and would require extensive customization to fit.

## Decision

**We build our own auth service inside `platform-cloud/`.** It is a focused, ~3,000-line service that handles:

- Account CRUD (email + password, optional WebAuthn)
- Device keypair registry
- Project membership
- Invitation tokens
- Session issuance (short-lived, refreshable)
- Challenge-response for device operations
- Audit log of auth events

We do not use Keycloak, Auth0, Clerk, WorkOS, Firebase Auth, or any other auth-as-a-service product.

## Consequences

### Positive

- **Fit the model exactly.** Our auth service knows about devices, projects, and roles natively. No mapping layer to OAuth/OIDC abstractions.
- **Smaller attack surface.** ~3,000 lines of focused Rust or TypeScript we can audit. Keycloak is a 500MB Java app.
- **No vendor lock-in.** Auth is the most critical component of any platform. Owning it means we can change anything.
- **No per-user fees.** Auth0/Clerk charge per MAU. At 1M users, that's a real cost. We pay for our own CPU.
- **Faster iteration.** We can ship a new auth feature in a single PR. No waiting for an external vendor.
- **Better security model.** Our auth is built around the device identity concept, not web sessions. We can implement mutual authentication, command signing, and per-project session binding natively.

### Negative

- **We own the security burden.** Any vulnerability in our auth service is a vulnerability in our product. We must invest in security review, fuzzing, and audit.
- **No "free" features.** Things Keycloak gives us (social login, SAML, OIDC) we have to build if we ever need them.
- **We need to hire/contract security expertise.** A "we built our own auth" project without security review is a disaster.
- **No proven production track record on day one.** Keycloak has been battle-tested for 10+ years. Our auth is new. We mitigate with: security audit before launch, conservative feature set, extensive testing.
- **More code to maintain.** ~3,000 lines is a lot, but it replaces a 500MB Java app. The trade is favorable.

### Neutral

- We can publish our auth service as an open-source library later if it proves valuable. Not a v1 priority.

## Auth Service Architecture

The service is a separate module inside `platform-cloud/`:

```
platform-cloud/
├── packages/
│   ├── auth/              ← our custom auth service
│   │   ├── src/
│   │   │   ├── account.ts
│   │   │   ├── device.ts
│   │   │   ├── session.ts
│   │   │   ├── invitation.ts
│   │   │   ├── challenge.ts
│   │   │   └── audit.ts
│   │   ├── schema.sql     ← accounts, devices, sessions, etc.
│   │   └── tests/
│   └── ...
└── apps/
    └── api/               ← Hono API, imports auth package
```

The service exposes a small, versioned API:
- `POST /v1/accounts` — create account
- `POST /v1/accounts/sessions` — login (returns session)
- `POST /v1/accounts/sessions/refresh` — refresh
- `POST /v1/devices` — register device (with public key)
- `POST /v1/devices/{id}/challenge` — get auth challenge
- `POST /v1/devices/{id}/verify` — submit signed challenge
- `POST /v1/devices/{id}/replace` — replace device (admin flow)
- `POST /v1/projects/{id}/invitations` — invite user (returns token; encodes role + module access)
- `POST /v1/invitations/{token}/accept` — accept invitation (creates empty account)
- `POST /v1/projects/{id}/memberships` — list memberships
- `POST /v1/projects/{id}/memberships` — admin assigns the pending user to a project + role (after seeing the "waiting" notification)
- `GET /v1/audit/auth` — auth audit log

## The empty-account pattern

Per the user's goal: *"he can let user to added by make them signup on the signup page but with id of this user becayse its created as empty, then if pc admin open or live it will receive the data"*.

A user cannot self-onboard. The flow is:

1. Admin issues an invitation. The token encodes the role + module access the Admin is pre-granting.
2. User goes to the signup page and enters the token.
3. Cloud creates an **empty account** — has credentials, has no project membership, no data, no role assignment yet.
4. Account sits in a `pending_pickup` state.
5. When the Admin comes online, the Admin sees "1 new user waiting to be assigned" in their Users page.
6. Admin assigns the user to a project + role + module access (defaulting to what was on the invitation).
7. The user is now a real member. Their User app transitions from "Waiting for Admin" to the normal project view.

The User cannot access any project data during the `pending_pickup` window. The Cloud enforces this at the auth middleware: pending users cannot make project-scoped API calls. The User app enforces this in the UI: shows only the "Waiting for Admin" screen.

Pending users are auto-soft-deleted after 30 days. The Cloud's `corbeille_audit` records this.

## Cryptographic Primitives

We use:
- **Ed25519** for device keypairs (small, fast, well-audited)
- **X25519** for any future E2E encryption between devices (not v1)
- **Argon2id** for password hashing (if we ever use passwords for accounts)
- **AES-256-GCM** for any data encryption needs
- **SHA-256 / SHA-3** for hashing

All via Rust's `ring` or `aws-ls-crypto` crate, or via `libsodium` bindings. No custom crypto. We use standard libraries, standard algorithms, no "cleverness."

## Session Model

Sessions are short-lived (15 minutes) and refreshable (rolling). The session token is a JWT signed by the auth service with a short TTL. Refresh tokens are stored server-side and can be revoked.

For device operations, the session must include the device ID. The auth service checks that the session's device matches the device making the request.

For project operations, the session includes a `current_project_id`. The auth service checks that the account has membership in the project.

## Password Authentication (Account-Level)

We allow email + password as one option for account creation, primarily for the customer to set up their first Admin account. Passwords are hashed with Argon2id with high memory cost (64MB+).

**We strongly recommend** WebAuthn (passkeys) for account login in v1.1+ — this is a better experience and more secure. But we don't force it; some customers will want password fallback.

In all cases, **the customer's account password is never used to derive encryption keys** for project data. Authentication and encryption are separate concerns. (See `01-PRINCIPLES.md` §9 for the key hierarchy.)

## Device Authentication

Devices have their own keypair, separate from the account. The flow:

```
1. Customer creates Admin account (email + password, or WebAuthn)
2. Customer installs Admin app on their machine
3. Admin app generates Ed25519 keypair in OS keychain
4. Admin app connects to Cloud, posts public key + project metadata
5. Cloud creates device record, links to account, returns device_id
6. Device is now ACTIVE for that account
```

For subsequent operations:

```
1. Device → Cloud: "I want to do operation X"
2. Cloud → Device: "Sign this challenge with your private key"
3. Device → Cloud: signed challenge
4. Cloud verifies signature
5. Cloud checks: is this device active? does it have permission for X?
6. Cloud returns result or error
```

Mutual authentication (Cloud → Device) happens via TLS during the request. The device verifies the Cloud's certificate via standard PKI (public CAs or our internal CA).

## Admin Device Replacement

When the Admin's device changes:

```
1. Current Admin: POST /v1/devices/{id}/replace with new device's public key
2. Cloud: marks current device as REPLACED
3. Cloud: marks new device as ACTIVE
4. Cloud: rotates the project's signing keys (re-issue signatures to all Users)
5. New device: must re-authenticate with account credentials
6. New device: re-downloads project data (from local cache or Cloud backup)
```

If the current device is lost, the customer contacts support with proof of account ownership. Support initiates a recovery flow with stronger verification (security questions, recovery code, support call).

## Audit

Every auth event is logged:
- Account created
- Login succeeded / failed
- Device registered
- Device revoked
- Password changed
- Session created
- Session expired
- Invitation sent
- Invitation accepted
- Admin device replaced

Logs are append-only, hash-chained, and queryable by the customer (read-only) and by our team (for support).

## What We Deliberately Do Not Build in v1

- **OAuth / OIDC provider.** We are not a general identity provider. Our auth is for our own apps.
- **Social login.** Customer accounts are for our customers, not for the general public. Email + password or WebAuthn is enough.
- **SAML / SSO.** Enterprise customers may want this in the future. Not v1.
- **MFA via TOTP.** WebAuthn is better. v1.1+ may add TOTP as fallback for customers without WebAuthn-capable devices.
- **Self-service account deletion.** We have a soft-delete + hard-delete flow, but it's not customer-facing in v1 (it's a support action).

## Alternatives Considered

### Keycloak

**Pros:** mature, feature-complete, open source.
**Cons:** Java + 500MB runtime; OAuth/OIDC-centric; weak device-identity story; would need a parallel "device auth" service anyway; hard to customize deeply.
**Rejected because:** we need device identity and project-scoped sessions, which Keycloak doesn't model natively. Mapping our model onto Keycloak's abstractions would be a constant translation tax.

### Auth0

**Pros:** mature, well-supported.
**Cons:** per-MAU pricing scales badly; vendor lock-in; limited customization; OAuth-centric.
**Rejected because:** at 1M users, Auth0's pricing is significant. And we don't need OAuth flows.

### Clerk

**Pros:** great DX, modern.
**Cons:** same as Auth0 — pricing, lock-in, OAuth-centric.
**Rejected for the same reasons.**

### WorkOS

**Pros:** enterprise SSO focus.
**Cons:** enterprise SSO is not our v1 use case; we don't need SAML/OIDC just for our own desktop apps.
**Rejected because:** we're not building enterprise SSO in v1.

### Supabase Auth

**Pros:** open source, includes Postgres + auth.
**Cons:** tied to Supabase platform; OAuth-centric; weak device identity.
**Rejected because:** we already have our own Postgres + Drizzle setup; we don't need Supabase's opinionated stack.

### Ory (Kratos + Hydra)

**Pros:** open source, more flexible than Keycloak.
**Cons:** still OAuth/OIDC-centric; more complex; would still need to build device identity on top.
**Rejected because:** the marginal value over rolling our own is small, and the operational cost of running Ory is similar to running our own focused service.

## Enforcement

- A linter rule: any code path that touches `accounts` or `devices` tables must go through the `auth` package. Direct SQL is not allowed.
- The `auth` package has 100% test coverage. Auth code is too critical for partial coverage.
- Security audit before v1 public launch. Budget allocated.
- All auth events go to the audit log. The audit log is append-only, hash-chained, and reviewed by our team weekly.
- The Cloud's signing key (used for module signing) is held in a separate process from the auth service. The auth service does not have access to signing keys. Compromise of auth does not equal compromise of signing.
