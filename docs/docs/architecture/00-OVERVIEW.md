# Platform Architecture — Overview

> **Status:** Locked
> **Last updated:** 2026-11-22
> **Owner:** Architecture team
> **Audience:** every engineer, AI agent, contractor touching the codebase

---

## 1. What this platform is

A **professional, modular, local-first desktop platform** for real organizations (clinics, laboratories, future verticals). The desktop apps run on Tauri (Rust + WebView) and operate against a private cloud control plane. Customers install Admin and User apps; our team operates the Cloud and the infrastructure it runs on.

This is **not** a normal SaaS. The Cloud is a **control plane**, not a business-data store. Each project has exactly **one Admin** as its source of truth, and any number of **Users** who hold only the data they are authorized to see.

The Cloud has **two connection surfaces**:

- a **public channel** (`/v1/*`) for customers (Admin, User)
- a **private channel** (`/ops/*`) for the platform owner — module publishing, plan CRUD, live-heart patch approval, recovery approval, ops actions

The private channel binds to our operations VPN interface only; the public listener returns 404 for every `/ops/*` path. Customers have no route and no credentials. See **ADR-013** and **PRINCIPLES §12**.

---

## 2. The three repositories

The ecosystem is split across **three independent repositories**. They do not share code, CI, or deployment infrastructure. They communicate only through versioned contracts.

- `internal-infra/` builds, signs and deploys `platform-cloud/` and runs STUN/probe/relay hosts, HSM/KMS, monitoring and CI.
- `product/` is built and code-signed by `internal-infra/` CI and shipped to customers.
- `product/` talks to `platform-cloud/` **only** through the versioned contracts package (§2.3).

### 2.1 What lives in each repo

| Repo | Contains | Does NOT contain |
|---|---|---|
| `product/` | Admin app, User app, modules (logic + UI), contracts package, Cloud-client SDK | Cloud source, infra, signing keys, billing data, Owner Console code |
| `platform-cloud/` | Public API, Owner Console SPA + `/ops/*` service, Postgres schema, auth, module registry, signing infra, plans, discovery, relay, MinIO | Customer apps, **business data**, module business logic |
| `internal-infra/` | CI/CD, secrets, HSM/KMS config, monitoring, deployment, STUN/probe, relay hosts, backup infra | App code, business logic |

### 2.2 Why three repos

1. **Access control** — the Cloud is the crown jewel. Future contractors and open-source contributors see only `product/`.
2. **Blast radius** — physical separation prevents an accidental `import` from leaking Cloud internals into the customer app.
3. **Deployment lifecycle** — the product ships to customers **every 2 weeks**, the Cloud deploys on our schedule, infra rarely changes.
4. **Compliance** — for a future SOC2 / HIPAA audit, `platform-cloud/` is a self-contained audit surface.

### 2.3 The boundary contract

`product/` talks to `platform-cloud/` **only** through the versioned Cloud API contract, published as a TypeScript package. The Cloud may swap Postgres, refactor auth, or restructure internally — none of it touches the product.

The product knows these endpoints:

```
# Accounts & sessions (Cloud API only — never gates project operation)
POST   /v1/accounts
POST   /v1/accounts/sessions
POST   /v1/accounts/sessions/refresh
POST   /v1/accounts/sessions/revoke
POST   /v1/accounts/mfa/enroll

# Devices (two keypairs: Ed25519 signing + X25519 encryption)
POST   /v1/devices/register
POST   /v1/devices/{id}/challenge
POST   /v1/devices/{id}/verify
POST   /v1/devices/{id}/replace
POST   /v1/devices/{id}/revoke

# Projects, invitations, membership
GET    /v1/projects
POST   /v1/projects
POST   /v1/projects/{id}/invitations
POST   /v1/invitations/{token}/accept
GET    /v1/projects/{id}/memberships
POST   /v1/projects/{id}/memberships
DELETE /v1/projects/{id}/memberships/{userId}
POST   /v1/projects/{id}/module-access

# Certificates (verified locally; this is why Cloud-offline works)
GET    /v1/membership-certificate
GET    /v1/admin-authority-certificate

# Modules
GET    /v1/modules
GET    /v1/modules/{id}/versions
GET    /v1/modules/{id}/versions/{v}/manifest
GET    /v1/modules/{id}/versions/{v}/package        (signed, encrypted bundle)

# Licensing, backups, recovery
POST   /v1/projects/{id}/license/refresh
GET    /v1/projects/{id}/escrow-public-key          (for per-backup wrapping)
POST   /v1/projects/{id}/backups                    (upload ciphertext + wrapped key)
GET    /v1/projects/{id}/backups                    (list backups)
GET    /v1/projects/{id}/backups/latest
GET    /v1/projects/{id}/backups/{backupId}         (download ciphertext + wrapped key)
POST   /v1/recovery/initiate
POST   /v1/recovery/cancel                          (customer cancels the 48h wait)

# Audit & updates
POST   /v1/audit                                    (batch chain snapshots)
GET    /v1/audit/auth                               (auth audit log)
GET    /v1/updates/core
GET    /v1/updates/app
GET    /v1/updates/patches                          (typed, signed — ADR-015)

# Billing & Plans
GET    /v1/plans
POST   /v1/billing/checkout
POST   /v1/billing/webhook                          (provider-agnostic interface)

# Discovery & relay (metadata / ciphertext only)
POST   /v1/discovery/heartbeat
GET    /v1/discovery/lookup?project_id=…&virtual_ip=…
POST   /v1/discovery/punch
GET    /v1/discovery/punch/{rendezvous_id}
GET    /v1/discovery/inbox                          (long-poll, punch requests for this device)
POST   /v1/discovery/opt-out
POST   /v1/relay/session                            (opt-in blind relay)

# Activation
POST   /v1/projects/{id}/activate                   (converts bootstrap to licence)
GET    /v1/projects/{id}/activation-file            (offline activation payload)
```

The contract is **the only** thing the two repos share. `/ops/*` is never in it, and the product never holds credentials for it.

---

## 3. The four systems

### 3.1 Cloud Platform (our private control plane)

**Owner:** our team.
**Stack:** Hono + PostgreSQL + Drizzle + MinIO + HSM/KMS.
**Knows about:** accounts, devices (public keys), projects, memberships + role IDs, the coarse module-access list, module registry and signatures, **plans as data**, billing state, licence issuance, discovery endpoint metadata, audit chain snapshots, encrypted backup blobs, and — **in assisted-recovery mode only** — an HSM-wrapped copy of each Backup Key.
**Does NOT know about:** patient names, lab results, invoices, appointments, per-role permission lists, or any per-project business data. In zero-knowledge mode it holds no usable backup key at all (ADR-022).

### 3.2 Admin Application (customer's desktop, project authority)

**Owner:** the customer.
**Stack:** Tauri 2 + React 19 + Vite + TanStack Router/Query + Rust + SQLite (SQLCipher) + Wasmtime + userspace WireGuard.
**Knows about:** all business data of its project, roles and permissions, installed modules, the event log, the outbox, the audit chain, tombstones, resource keys, blind indexes, the erasure ledger, per-member cursors and permission versions, mesh peers, licence state.
That is **18 platform tables** plus `mod_<name>_*` business tables, all inside one `project.db` per project (ADR-005, ADR-012).
**Does NOT know about:** other projects' data, other customers, the Cloud's internal schema.
The Admin is also a **server** on the project mesh, and may run **headless on an always-on mini-PC** so a sleeping laptop does not block the team (ADR-002).

### 3.3 User Application (customer's desktop, projection client)

**Owner:** the customer.
**Stack:** same as Admin, with restricted capabilities.
**Knows about:** only the data it is authorized to read, its own sync cursor and permission version, its own certificates, and its installed modules. That is **6 platform tables** plus rebuildable `proj_*` projection tables (ADR-012).
**Does NOT know about:** other users' data, the audit chain, the Admin's business schema.
**No command queue in v1.** The `outbox` table exists but is never written (ADR-009).

### 3.4 Internal Infrastructure (our team only)

**Owner:** our ops team.
**Stack:** Prometheus + Grafana + Loki + Tempo + Infisical + Woodpecker + Docker Compose + HSM/KMS + coturn (STUN) + relay hosts.
**Knows about:** how the Cloud runs, who has access, what is deployed, what broke.
**Does NOT know about:** business data, customer content.

---

## 4. The authority model

```text
OWNER (us) ──► CLOUD   control plane: accounts, devices, plans, licences, signing, discovery metadata, backups
                │      HTTPS — control path only, never the data path
              ADMIN    project authority: business data, roles, modules, events, audit, keys
                │      project mesh: LAN → direct → hole-punch → relay (ciphertext only)
               USER    projection only: authorised view, cache, sync cursor
```

| Question | Answer |
|---|---|
| Who owns business data? | **Admin.** Always. |
| Who controls user permissions? | **Admin.** The Cloud knows membership, role IDs and the coarse module-access list — never the permission lists. |
| Who can sign a module? | **Cloud**, via the private channel, with quorum approval. Root → project licence → device binding (ADR-007). |
| Who publishes a new module? | **Us**, via the private channel. Customers cannot publish third-party modules in v1. |
| Who can replace the Admin device? | **Cloud**, after the recovery ceremony (ADR-010, ADR-022). |
| What if the Admin is offline? | Users read cached data. **They cannot write.** `ADMIN_OFFLINE` / `ADMIN_UNKNOWN` (ADR-009). |
| What if the Cloud is offline? | **The project keeps working — reads and writes.** The Admin verifies Cloud-signed membership certificates locally (ADR-012). Paused: enrolment, module install, Cloud backup, licence refresh. Bounded by the licence grace window (ADR-014). |
| What if both are offline? | Users read cached data; no writes. Local backup and export still work. |
| Can we read a customer's backups? | **Assisted mode:** only via a controlled, audited, customer-alerted recovery. **Zero-knowledge mode:** never (ADR-022). |

The full combination table is in `FAILURE-MATRIX.md`.

---

## 5. Communication paths

The mesh is **our own implementation** — no Tailscale, no Headscale, no third-party VPN (ADR-017). The tunnel runs **in userspace inside the app**: no kernel driver, no system adapter, **no administrator rights**, and no OS route changes (ADR-024).

Addresses are **per-project namespaces**: `(project_id, virtual_ip)` from `10.50.0.0/16`. The Admin is `10.50.0.1` within its project; Users are `.2`, `.3`, … A device in two projects has two addresses and two tunnels (ADR-018).

The path ladder, in order:

| # | Method | When | Privacy |
|---|---|---|---|
| 1 | **Direct LAN** — mDNS service discovery + WireGuard | Same network | 100% local, no internet |
| 2 | **Direct internet** — WireGuard over reachable IPv6 or IPv4 (cached endpoint first) | At least one side reachable | 100% direct |
| 3 | **UDP hole-punch** — coordinated by discovery (rendezvous + short-poll) | Both behind NAT, at least one cone NAT | 100% direct after the punch |
| 4 | **Relay** — customer-hosted VM, or our **opt-in blind relay** | Hole-punch fails (symmetric NAT / filtering CGNAT) | Forwards **ciphertext only**; cannot read or forge |
| 5 | **TCP/443 carrier** | Network blocks UDP | Same encryption, different carrier |
| 6 | **Sneakernet (USB)** | No connectivity at all | **Read-only snapshot export/import — never writes** |

LAN is always tried first, **before and after** any discovery interaction. The application does not care which path is in use.

**The Cloud is never in the data path for project operations.** It is in the control path: auth, certificates, licences, signing, discovery, audit, backup, updates.

**Honest metadata statement.** Discovery learns each device's **observed** public endpoint and heartbeat time, and a signed lookup reveals that *device A asked about device B* within a project. Lookups are project-scoped, replay-protected and logged for 30 days; the customer can see that log. We never see message contents, payloads, connection durations, or business data — and we do **not** claim zero knowledge of contact intent (ADR-020). Discovery is opt-out; LAN, QR/manual pairing and relays work without it.

---

## 6. The first two business modules

| Module | Scope | Operations |
|---|---|---|
| **medical-reception** | One doctor + N staff (secretaries). NOT a full clinic EMR/HIS. | patients, appointments, visit notes (SOAP), prescriptions |
| **food-lab** | Sample → test → analysis → result → report | samples, tests, results, reports, lab workflow |

Each module ships as **one bundle**: encrypted WASM logic + **signed static UI** (rendered in an opaque-origin sandboxed iframe) + a triple-signed manifest + a certificate chain (ADR-007, ADR-011). Adding a module or a page is a **module release, not an app release**.

Modules run inside the Admin (full capability grants) and the User (projection reads + command submission). They cannot read each other's tables, cannot reach the audit log or keys, and their UI has **no network access at all**.

**v1 ships exactly these two modules.** No third-party modules, no marketplace. They are published and updated by us, via the private channel, with quorum approval.

**Future verticals (examples, not scope):** dental-clinic, vet-clinic, pharmacy,
school-lab. Each is a new signed bundle with its own `mod_<id>_*` prefix.
Adding one never migrates existing project data (ADR-006/007/011).
### 6.1 The project creation form (4 fields)

| Field | What | Example |
|---|---|---|
| **Project name** | Internal name for this project | "Reception 2026" |
| **Admin's last name** | The human responsible for this project | "Smith" |
| **Business type** | What kind of business this is | `medical_reception` / `food_lab` / `other` |
| **Business name** | The company / clinic / lab | "Dr. Smith's Family Clinic" |

These four fields live in the Admin's `project_meta`. The Cloud receives `business_type` and `admin_last_name` so support knows who to talk to.

---

## 7. Plans

**Plans are data in the Cloud database**, not hardcoded tiers. The owner creates and edits plans through the Owner Console with quorum approval. Entitlements are enforced by **what the Cloud will sign** — never by `if plan == X` in the client (ADR-014, ADR-021).

The v1 seed data:

| Feature | Plan 1 (Local) | Plan 1+ (Solo Cloud) | Plan 2 (Starter) | Plan 3 (Team) | Plan 4 (Enterprise) |
|---|---|---|---|---|---|
| Admin devices | 1 | 1 | 1 | 1 | 1 |
| Projects | 1 | 1 | 1 | 1 | multiple |
| Users (licensed) | 0 | 0 | up to 3 | up to 10 | unlimited |
| Users (tested ceiling) | 0 | 0 | 3 | 10 | **200 concurrent per Admin** |
| Cloud backup | ✗ | daily | daily | daily | daily + manual |
| Backup window (Admin picks) | — | 00:00–06:00 local | 00:00–06:00 local | 00:00–06:00 local | 00:00–06:00 local |
| Backup quota | — | 10 GB | 50 GB | 500 GB | 5 TB (**4.9 TB daily + 100 GB manual**) |
| Manual backup limits | — | — | — | — | 10/month, ≤10 GB each, ≤100 GB total |
| Corbeille quota | local only | 5 GB | 5 GB | 50 GB | 500 GB |
| Audit snapshot retention | local only | 1 year | 1 year | 5 years | forever |
| Backup retention (days) | — | 30 | 30 | 30 | 30 |
| Custom modules | ✗ | ✗ | ✗ | ✗ | ✓ (per-project licence, published by us) |
| Licence shape | **perpetual local** | 30-day renewable | 30-day renewable | 30-day renewable | 30-day renewable |

Three clarifications that used to be ambiguous:

- **Corbeille quota** is the serialized byte size of the Admin's local `tombstones` table. The Cloud holds deletion metadata only (ADR-016).
- **Audit retention** is the availability window for **Cloud-held audit snapshots**. The Admin's local hash chain is **never deleted** (Principle 11).
- **"Unlimited" users** means unlimited *licensed*. The **tested ceiling** is an engineering statement, raised only with load-test evidence.

Licence lifecycle: 30-day TTL → 14-day offline grace → **read-only allow-list** (read, export, print, local backup, verify audit). Non-payment never deletes data and never blocks export (Principle 14). Plan 1 holds a perpetual local licence and never needs the Cloud after activation.

Plan enforcement happens **at the Cloud boundary** for Cloud-mediated operations and **at the Admin** for local operations. The User app is plan-agnostic — it can only do what its Admin permits.

### 7.1 The first-run flow

```text
1. Auth page — sign in, or sign up with an invitation token from an Admin
2. Build project — the 4 fields
3. Plan picker — Plan 1 / 1+ / 2 / 3 / 4
4. Project picker — existing project, or create (if the plan allows)
5. Admin app shell loads
6. Project opens
7. Modules load (medical-reception / food-lab, per business_type)
```

Returning customer: skip steps 2–3, go straight to step 4.

**With no internet on first launch**, steps 1 and 3 are deferred: the Admin creates the project locally and runs the standard modules under a **30-day bootstrap grace**, then activates free with one round trip — or with a signed offline activation file for air-gapped sites. Nothing created during bootstrap is lost (ADR-023).

### 7.2 Roles — many users, one authorization set

The Admin defines roles ("Doctor", "Receptionist", "Lab Analyst") and assigns them to members. Effective permission is the **union of all roles**, evaluated live at every boundary. Permissions are `module.resource.action`, per resource type in v1 (ADR-012).

The Admin owns the role catalogue and permission lists. The Cloud knows membership, role IDs, and the coarse module-access list used for bundle issuance — nothing finer.

Granting access sends a **partial backfill snapshot** so the member actually receives the history. Revoking sends a **Purge** frame; deletion on the User is best-effort and described honestly (ADR-012).

### 7.3 The user signup (empty account → Admin assigns)

```text
1. Admin issues an invitation (email + role + module access)
2. Cloud creates an OPAQUE, single-use, email-bound token with an expiry
   (default 7 days). The grant is stored server-side, never inside the token.
3. User signs up with the token and enrolls a mandatory second factor
4. Cloud creates an EMPTY account (no membership, no data, no role)
5. User app shows "Waiting for Admin"
6. Admin comes online → "1 new user waiting to be assigned"
7. Admin assigns project + role + module access
8. Cloud issues the membership certificate; Admin issues device-bound bundles;
   the User app shows the project
```

The Admin is the gatekeeper; the Cloud is the identity provider. Pending accounts are auto-soft-deleted after 30 days, recorded in the Cloud's corbeille audit.

### 7.4 The corbeille

Soft-deleted records live in the Admin's `tombstones` table, held per the plan quota. Restore is a normal authorized write (and therefore denied in read-only mode). At quota, the oldest tombstone is hard-deleted and its resource key destroyed.

The **30-day recovery grace** is a property of **backup retention**: a support-assisted restore from a pre-deletion backup is possible within 30 days in assisted mode, or customer-self-service with the recovery code in zero-knowledge mode, after which rotation removes the last copies. It is not a hidden second trash can (ADR-016).

Legal erasure is stronger and separate: crypto-shredding plus a permanent `erasure_ledger` entry that is **re-applied on every restore**, so erased data cannot come back (ADR-016).

### 7.5 The live heart — Cloud pushes data and logic updates

The Cloud is authoritative for updates: app, core, modules, schema, **typed data patches**, and logic. Updates are signed, versioned, dry-run, and applied in one transaction with a pre-update snapshot.

The owner's "run specific SQL" intent is honored as **typed, allow-listed operations** compiled to SQL locally by the Admin — never raw SQL shipped to devices. Patches can never touch `events`, `audit_entries`, `command_log`, or the other protected platform tables (ADR-015).

Blast-radius controls: a **separate offline patch-signing key** with a quorum ceremony, **ring rollouts** (5% → 25% → 100%) with automatic health gates, and a **pre-signed kill-switch** for every critical patch.

Critical patches carry a deadline. If it passes unapplied, the app enters **restricted mode**: business writes refused, while read, export, print and local backup remain available. A security deadline never traps customer data (Principles 10 and 14).

---

## 8. Table Classes (for Test #6 precision)

To prove v1 is a true subset of the final architecture (Acceptance Test #6: rebuild-and-diff), tables are strictly classified:

1. **Projected business tables** (change *only* via `apply_event`; reproduced by replay): `mod_*`, `project_meta`, `profiles`, `tombstones`, `erasure_ledger`, `roles`, `role_permissions`, `member_roles`.
2. **Log tables** (append-only): `events`, `audit_entries`, `command_log`, `outbox`. (`outbox` rows with `status='skipped'` older than 30 days may be pruned; `outbox` is excluded from the diff.)
3. **Host-state tables** (not replayed from events): `module_registry`, `schema_version`, `resource_keys`, `blind_indexes`, `membership_certs`, `user_projections`, `mesh_peers`.

The authoritative definition is ADR-012 §5.

---

## 9. What we state honestly

Four things a professional buyer deserves to hear plainly, rather than discover later:

1. **Backups.** In assisted mode we hold a wrapped key and *can* decrypt — only through a 48-hour, quorum-approved, customer-alerted, audited recovery. In zero-knowledge mode we cannot decrypt at all, and a lost recovery code means lost backups (ADR-022).
2. **Metadata.** Discovery sees endpoints, heartbeat times, and lookup intent within a project. Never contents (ADR-020).
3. **Client limits.** Encryption, signatures and sandboxing raise the bar a long way; they are **not absolute DRM** on a machine the customer controls (ADR-007, ADR-011, Principle 13).
4. **Networking.** Hole-punching works through many NATs, not all. Symmetric CGNAT on both sides needs a relay — ours (blind, opt-in) or theirs (ADR-024).

---

## 10. How to read this document set

```text
docs/architecture/
├── 00-OVERVIEW.md                 ← you are here
├── 01-PRINCIPLES.md               ← 14 non-negotiable rules
├── 02-DECISIONS/
│   ├── ADR-001-three-repository-model.md
│   ├── ADR-002-admin-as-source-of-truth.md
│   ├── ADR-003-tailscale-headscale-mesh-identity.md   (SUPERSEDED → 017/018/024)
│   ├── ADR-004-global-sequence-per-user-cursor.md
│   ├── ADR-005-one-sqlite-per-project.md
│   ├── ADR-006-wasmtime-module-runtime.md
│   ├── ADR-007-triple-signed-modules.md
│   ├── ADR-008-snapshot-on-gap-recovery.md
│   ├── ADR-009-no-offline-writes-v1.md
│   ├── ADR-010-roll-our-own-auth.md
│   ├── ADR-011-module-bundle-and-ui.md
│   ├── ADR-012-permissions-and-sync-filtering.md
│   ├── ADR-013-private-channel-owner-console.md
│   ├── ADR-014-licensing-and-entitlements.md
│   ├── ADR-015-live-heart-safe-patching.md
│   ├── ADR-016-data-lifecycle-and-erasure.md
│   ├── ADR-017-pure-local-networking.md              (parent of 018/019/020/024)
│   ├── ADR-018-stable-ip-mesh.md
│   ├── ADR-019-cgnat-detection.md
│   ├── ADR-020-discovery-service.md
│   ├── ADR-021-plan-tiers.md
│   ├── ADR-022-key-custody-and-recovery.md           (authoritative key hierarchy)
│   ├── ADR-023-offline-bootstrap.md
│   └── ADR-024-userspace-tunnel-and-relay.md
├── 03-STACK.md                    ← exact tools, versions, why
├── 04-GLOSSARY.md                 ← shared vocabulary
├── SYNC-PROTOCOL.md               ← frames, write path, sync rules
├── THREAT-MODEL.md                ← adversaries, mitigations, residual risk
└── FAILURE-MATRIX.md              ← Cloud / Admin / User down combinations
```

If something in the code disagrees with this doc set, **the doc set wins** until an ADR supersedes it. Any change to architecture is an ADR.