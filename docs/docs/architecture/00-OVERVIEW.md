# Platform Architecture — Overview

> **Status:** Locked
> **Last updated:** 2026-07-26
> **Owner:** Architecture team
> **Audience:** Every engineer, AI agent, contractor touching the codebase

---

## 1. What this platform is

A **professional, modular, local-first desktop platform** for real organizations (clinics, laboratories, future verticals). The desktop apps run on Tauri (Rust + WebView) and operate against a private cloud control plane. Customers install Admin and User apps; our team operates the Cloud and the infrastructure it runs on.

This is **not** a normal SaaS. The Cloud is a **control plane**, not a business-data store. Each project has exactly **one Admin** as its source of truth, and any number of **Users** who hold only the data they are authorized to see.

The Cloud has **two connection surfaces**: a public channel (`/v1/*`) for customers (Admin, User), and a private channel (`/ops/*`) reserved for the platform owner/developer (module publishing, live-heart updates, ops actions). The customer never sees the private channel. See ADR-013-equivalent note in §3 and PRINCIPLES §12.

---

## 2. The three repositories

The ecosystem is split across **three independent repositories**. They do not share code, CI, or deployment infrastructure. They communicate only through versioned contracts.
┌────────────────────────────────────────────────────────────────────────┐
│ internal-infra/ (private, ops team only) │
│ • Secrets management (Infisical) │
│ • CI/CD pipelines (Gitea + Woodpecker) │
│ • Monitoring (Prometheus + Grafana + Loki + Tempo) │
│ • Backups (MinIO, retention policies) │
│ • Deployment (Docker Compose, K8s manifests) │
└────────────────────────────────────────────────────────────────────────┘
▲ ▲
│ deploys │ deploys
│ │
┌───────────────────┴──────────────┐ ┌────────────────────┴──────────┐
│ platform-cloud/ │ │ product/ │
│ (private, our team) │◄───┤ (commercial, ships to │
│ │ │ customers) │
│ • Hono API │ │ • Admin (Tauri + React) │
│ • PostgreSQL 16 │ │ • User (Tauri + React) │
│ • Drizzle ORM │ │ • Shared contracts pkg │
│ • Custom auth service │ │ • Cloud-client (TS SDK) │
│ • Module registry & signing │ │ • Modules (WASM): │
│ • Platform audit │ │ - medical-reception │
│ • Account / Project / Device │ │ - food-lab │
│ • MinIO (encrypted backups) │ │ • Per-project SQLite │
│ │ │ • Wasmtime runtime │
│ │ │ • WireGuard (kernel) │
│ │ │ • mDNS (LAN discovery) │
└─────────────────┬───────────────┘ └────────┬───────────────────────┘
│ │
│ cloud API (HTTPS) │
│ for account/billing/ │
│ encrypted backups only │
│ │
└──────────────┬──────────────┘
│
Admin ◄──────► User
(LAN: mDNS+WireGuard, or
WAN: IPv6/static-IP/customer-relay)



### 2.1 What lives in each repo

| Repo | Contains | Does NOT contain |
|---|---|---|
| `product/` | Admin app, User app, modules, shared contracts package, Cloud-client SDK | Cloud source, infra, signing keys, billing data |
| `platform-cloud/` | Cloud API, PostgreSQL schema, auth service, module registry, signing infra, MinIO | Customer apps, business data, UI (admin panel is a separate SPA, not in here) |
| `internal-infra/` | CI/CD, secrets, monitoring, deployment, backup infra | App code, business logic |

### 2.2 Why three repos

1. **Access control** — the Cloud is the crown jewel. Future contractors / open-source contributors should only see `product/`.
2. **Blast radius** — physical separation prevents an accidental `import` from leaking Cloud internals into the customer app.
3. **Deployment lifecycle** — product ships to customers weekly, Cloud deploys internally, infra rarely changes.
4. **Compliance** — for any future SOC2 / HIPAA audit, `platform-cloud/` is a self-contained audit surface.

### 2.3 The boundary contract

`product/` talks to `platform-cloud/` **only** through the versioned Cloud API contract published as a TypeScript package. The Cloud may internally swap Postgres for another DB, change its module structure, refactor its auth — none of that touches the product. The product knows these endpoints:
POST /v1/accounts
POST /v1/accounts/sessions
POST /v1/devices/register
POST /v1/devices/{id}/replace
GET /v1/projects
POST /v1/projects
POST /v1/projects/{id}/invitations
POST /v1/projects/{id}/memberships
GET /v1/modules
GET /v1/modules/{id}/versions
GET /v1/modules/{id}/versions/{v}/manifest
GET /v1/modules/{id}/versions/{v}/package (signed bundle)
POST /v1/audit (batch upload from Admin)
GET /v1/updates/core
GET /v1/updates/app

The contract is **the only** thing the two repos share. Everything else is private.

---

## 3. The four systems

Within the broader ecosystem, we model **four systems**, each with a distinct responsibility and a clear owner.

### 3.1 Cloud Platform (our private control plane)

**Owner:** our team.
**Stack:** Hono + PostgreSQL 16 + Drizzle + MinIO.
**Knows about:** accounts, devices, projects, memberships, invitations, module registry, platform audit, billing, plans.
**Does NOT know about:** patient names, lab results, invoices, appointments, or any per-project business data.

### 3.2 Admin Application (customer's desktop, project authority)

**Owner:** the customer.
**Stack:** Tauri 2 + React 19 + Vite + TanStack Router/Query + Rust + SQLite + Wasmtime.
**Knows about:** all business data of its project, users, permissions, modules installed for this project, audit, outbox.
**Does NOT know about:** other projects, other customers, the Cloud's internal schema.

### 3.3 User Application (customer's desktop, projection client)

**Owner:** the customer.
**Stack:** same as Admin, including Wasmtime module runtime, but with restricted capabilities (read authorized projection + submit commands).
**Knows about:** only the data it is authorized to read for its project, its own command queue, its own sync cursor.
**Does NOT know about:** other users' data, audit details, the Admin's internal schema.

### 3.4 Internal Infrastructure (our team only)

**Owner:** our ops team.
**Stack:** Prometheus + Grafana + Loki + Tempo + Infisical + Woodpecker CI + Docker Compose.
**Knows about:** how the Cloud runs, who has access, what's deployed, what broke.
**Does NOT know about:** business data, customer content.

---

## 4. The authority model
YOUR TEAM
│
┌────────────▼────────────┐
│ CLOUD PLATFORM │ ← platform authority
│ (accounts, devices, │
│ projects, modules, │
│ audit, billing) │
└────────────┬────────────┘
│
control plane
(HTTPS, NOT in data path)
│
┌────────────▼────────────┐
│ ADMIN │ ← project authority
│ (project truth, │
│ users, modules, │
│ outbox, audit) │
└────────────┬────────────┘
│
project network
(LAN: mDNS+WireGuard;
WAN: IPv6/static-IP/customer-relay)
│
┌────────────▼────────────┐
│ USER │ ← projection only
│ (authorized view, │
│ local cache, │
│ command queue) │
└─────────────────────────┘


| Question | Answer |
|---|---|
| Who owns business data? | **Admin.** Always. |
| Who controls user permissions? | **Admin.** The Cloud only knows *that* a user is a member, not what they can do. |
| Who can sign a module? | **Cloud (private channel).** Modules are signed by the platform's root key, then licensed per-project. |
| Who publishes a new module? | **App owner (us), via the private channel.** Customers cannot publish third-party modules in v1. |
| Who can replace the Admin device? | **Cloud**, after strong recovery verification. |
| What if Admin is offline? | **Users can read cached data. They cannot write.** Authoritative writes require Admin. |
| What if Cloud is offline? | **Admin continues to operate.** Users can read cached data. Backup, module install, account ops are paused. |

---

## 5. Communication paths

The platform supports **four** transport paths between Admin and User. The application does not care which one is in use. The mesh is **our own implementation** (no Tailscale, no Headscale, no third-party VPN — see ADR-017).

| Priority | Method | When | Privacy |
|---|---|---|---|
| 1 | **Direct LAN** (mDNS + WireGuard) | Same network | 100% local, no internet |
| 2 | **Direct internet** (WireGuard over IPv6 or static IPv4) | Both have public IPs | 100% direct, no relay |
| 3 | **NAT traversal** (outbound-initiated, hole-punch) | One side has public IP, other behind NAT | 100% direct after hole-punch |
| 4 | **Customer-hosted relay** (WireGuard through customer's VM) | Both behind CGNAT | Customer's own server, opt-in |

**The Cloud is never in the data path** for project operations. It is only in the control path (auth, discovery, signing, audit, backup-receive, update-publish). The **discovery service** (ADR-020) knows each device's virtual IP → real public IP mapping via heartbeats, but never sees message contents or "who's talking to whom." Customers can opt out of discovery (use LAN or customer relay only).



The Cloud is **never** in the data path for project operations. It is only in the control path (auth, discovery, signing, audit, backup).

---

## 6. The first two business modules

| Module | Scope | Operations |
|---|---|---|
| **medical-reception** | One doctor + N staff (secretaries). NOT a full clinic EMR/HIS. | patients, appointments, basic visit notes (SOAP), prescriptions. |
| **food-lab** | Sample → test → analysis → result → report. | samples, tests, results, reports, lab workflow. |

Both modules are **WASM artifacts**, signed by the Cloud (by us, via the private channel) and licensed to specific projects. They run inside the Admin (full power) and the User (projection only). They cannot read each other's data and cannot escape their sandbox.

**v1 ships exactly these two modules.** No third-party modules. No marketplace. The first two are added and updated by the platform owner (us) via the private channel, not by customers.

## 6.1 The project creation form (4 fields)

When a customer creates a new project, the Admin's "build project" page has **four fields** in this order:

| Field | What | Example |
|---|---|---|
| **Project name** | Internal name for this project | "Reception 2026" |
| **Admin's last name** | The human responsible for this project (the Admin) | "Smith" |
| **Business type** | What kind of business this is | `medical_reception` / `food_lab` / `other` |
| **Business name** | The company / clinic / lab the project is for | "Dr. Smith's Family Clinic" |

Then the plan picker. Then the customer lands in the project view. These four fields are stored in the project's metadata on the Admin. The Cloud receives the `business_type` and `admin_last_name` (so our support team knows who to talk to).

---

## 7. Plans

Four plans, structured around what's actually variable:

| Feature | Plan 1 (Local) | Plan 2 (Starter) | Plan 3 (Team) | Plan 4 (Enterprise) |
|---|---|---|---|---|
| Admin user count | 1 | 1 | 1 | 1 |
| Project count | 1 | 1 | 1 | multiple |
| User count | 0 | up to 3 | up to 10 | unlimited |
| Cloud backup | ✗ | daily | daily | daily + manual (limited) |
| Backup time (admin picks) | — | 00:00–06:00 local | 00:00–06:00 local | 00:00–06:00 local |
| Backup storage quota | — | 50 GB | 500 GB | 5 TB (4.5 TB daily + 500 GB manual) |
| Plan 4 manual backup limits | — | — | — | 10/month, 10 GB each, 100 GB total |
| Custom modules | ✗ | ✗ | ✗ | ✓ (per-project license, added by us via private channel) |
| Audit retention | local only | 1 year | 5 years | forever |

Plan enforcement happens **at the Cloud boundary** for Cloud-mediated operations, and **at the Admin** for local operations. The User app is plan-agnostic — it can only do what its Admin permits.

---

## 7.1 The user flow (auth → build project → plan → select → load)

The first-run experience, per the user's goal:

```
1. Auth page — sign in (or sign up with an invitation token from an Admin)
2. Build project page — fill in the 4 fields (name, last name, business type, business name)
3. Plan picker — choose Plan 1 / 2 / 3 / 4
4. Project picker — select an existing project, or create a new one (if plan allows)
5. Main app loads (the Admin app shell)
6. Project loads (the chosen project opens)
7. Modules load (medical-reception / food-lab, depending on business_type)
```

For a returning customer: skip step 2 and 3, go straight to step 4.

---

## 7.2 Roles — many users with the same authorization

The Admin can define roles (e.g., "Doctor", "Receptionist", "Lab Analyst") and assign each user a role. Many users can share the same role. A user's effective permissions are the union of all their role's permissions. This avoids duplicating permission lists across N users and matches the user's "may many users have same authorization exact" requirement.

The Admin manages the role catalog. The Cloud does not know the per-role permission list (only the Admin does). The Cloud knows which user is a member of which project and which role IDs are assigned (for module-access checks).

---

## 7.3 The user signup (empty account → admin assigns)

A user cannot create an account on their own. The flow:

```
1. Admin issues an invitation (with email + role + module access)
2. Cloud creates the invitation token, sends to the user
3. User signs up at the signup page with the token
4. Cloud creates an EMPTY account (no project membership yet)
5. User's User app shows "Waiting for Admin" — no project data visible
6. When Admin comes online, Admin sees "1 new user waiting to be assigned"
7. Admin assigns the user to a project + role + module access
8. Now the user is a real member; their User app shows the project
```

This puts the **Admin in control** of who gets in. The Cloud is the auth provider, but the Admin is the gatekeeper. Matches the user's goal: "he can let user to added by make them signup on the signup page but with id of this user becayse its created as empty".

---

## 7.4 The corbeille (forever soft-delete)

Soft-deleted records are held per the plan's quota (Plan 1: local only, Plan 2: 5 GB, Plan 3: 50 GB, Plan 4: 500 GB). When the quota is reached, the oldest soft-deleted record is hard-deleted (entering the 30-day recovery grace). The customer can restore any soft-deleted record.

The Cloud stores deletion metadata (who, when, what type, in which project) for compliance and for the owner of the Cloud. The Admin holds the actual soft-deleted data. Matches the user's goal: "we will hold its things that make the deleted soft or hard we will hold them".

---

## 7.5 The live heart — Cloud pushes data and logic updates to Admin

The Cloud is authoritative for updates — not just app updates, but also schema migrations, data patches (run specific SQL), and logic changes. Updates are signed, versioned, and applied in a transaction with rollback. Critical updates have a deadline (Admin refuses to start if not applied). Matches the user's goal: "the update should happen always (we may change logic or core systeme of users and can run specific sql) this is the live heart of the app its important".

---

## 8. How to read this document set
docs/architecture/
├── 00-OVERVIEW.md ← you are here
├── 01-PRINCIPLES.md ← 13 non-negotiable rules
├── 02-DECISIONS/ ← ADRs — why we picked what we picked
│ ├── ADR-001-three-repository-model.md
│ ├── ADR-002-admin-as-source-of-truth.md
│ ├── ADR-003-tailscale-headscale-mesh-identity.md (SUPERSEDED — see ADR-017, ADR-018)
│ ├── ADR-004-global-sequence-per-user-cursor.md
│ ├── ADR-005-one-sqlite-per-project.md
│ ├── ADR-006-wasmtime-module-runtime.md
│ ├── ADR-007-triple-signed-modules.md
│ ├── ADR-008-snapshot-on-gap-recovery.md
│ ├── ADR-009-no-offline-writes-v1.md
│ ├── ADR-010-roll-our-own-auth.md
│ ├── ADR-017-pure-local-networking.md  (the parent of 018, 019, 020)
│ ├── ADR-018-stable-ip-mesh.md
│ ├── ADR-019-cgnat-detection.md
│ └── ADR-020-discovery-service.md
├── 03-STACK.md ← exact tools, versions, why
└── 04-GLOSSARY.md ← shared vocabulary (TBD)



If something in the code disagrees with this doc set, **the doc set wins** until an ADR supersedes it. Any change to architecture is an ADR.