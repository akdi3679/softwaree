# Platform Architecture - Overview

> **Status:** Locked
> **Audience:** every engineer, every AI agent, every contractor touching the codebase
> **Note:** this file was recovered in the wiring session from an earlier draft.
>         Compare with any externally-held original before treating as canonical.

---

## 1. What this platform is

A professional, modular, local-first desktop platform for real organizations
(clinics, laboratories, future verticals). Desktop apps run on Tauri
(Rust + WebView) and operate against a private cloud control plane.
Customers install Admin and User apps; our team operates the Cloud.

This is not a normal SaaS. The Cloud is a control plane, not a business-data
store. Each project has exactly one Admin as its source of truth, and any
number of Users who hold only the data they are authorized to see.

The Cloud has two connection surfaces: a public channel (/v1/*) for
customers (Admin, User), and a private channel (/ops/*) reserved for the
platform owner (module publishing, live-heart updates, ops actions).

---

## 2. The three repositories

    internal-infra/    (private, ops only)  - secrets, CI/CD, monitoring, backups, deploy
    platform-cloud/    (private, our team)  - Hono API, Postgres, Drizzle, auth, module registry, audit
    product/           (commercial, ships)  - Admin + User apps, modules, shared contracts, cloud-client

They do not share code, CI, or deployment infra. They communicate only
through versioned contracts.

### 2.1 What lives in each repo

| Repo | Contains | Does NOT contain |
|---|---|---|
| product/ | Admin + User apps, modules, contracts pkg, cloud-client SDK | Cloud source, infra, signing keys, billing data |
| platform-cloud/ | Cloud API, Postgres schema, auth, module registry, signing infra, MinIO | Customer apps, business data, UI |
| internal-infra/ | CI/CD, secrets, monitoring, deployment, backup infra | App code, business logic |

### 2.2 Why three repos

1. Access control - contractors/open-source contributors see only product/.
2. Blast radius - prevents accidental import of Cloud internals into the app.
3. Deployment lifecycle - product ships weekly, Cloud deploys internally, infra rarely.
4. Compliance - platform-cloud/ is a self-contained audit surface.

### 2.3 The boundary contract

product/ talks to platform-cloud/ only through the versioned Cloud API,
published as a TypeScript package. The product knows these endpoints:

    POST /v1/accounts
    POST /v1/accounts/sessions
    POST /v1/devices/register
    POST /v1/devices/{id}/replace
    GET  /v1/projects
    POST /v1/projects
    POST /v1/projects/{id}/invitations
    POST /v1/projects/{id}/memberships
    GET  /v1/modules
    GET  /v1/modules/{id}/versions
    GET  /v1/modules/{id}/versions/{v}/manifest
    GET  /v1/modules/{id}/versions/{v}/package  (signed bundle)
    POST /v1/audit                               (batch upload from Admin)
    GET  /v1/updates/core
    GET  /v1/updates/app

The contract is the only thing the two repos share.

---

## 3. The four systems

### 3.1 Cloud Platform (our private control plane)

Owner: our team.
Stack: Hono + PostgreSQL 16 + Drizzle + MinIO.
Knows: accounts, devices, projects, memberships, invitations, module
registry, platform audit, billing, plans.
Does NOT know: patient names, lab results, invoices, appointments, or any
per-project business data.

### 3.2 Admin Application (customer's desktop, project authority)

Owner: the customer.
Stack: Tauri 2 + React 19 + Vite + TanStack Router/Query + Rust + SQLite + Wasmtime.
Knows: all business data of its project, users, permissions, modules
installed for this project, audit, outbox.
Does NOT know: other projects, other customers, Cloud's internal schema.

### 3.3 User Application (customer's desktop, projection client)

Owner: the customer.
Stack: same as Admin, restricted capabilities (read authorized projection
+ submit commands).
Knows: only the data it is authorized to read for its project, its own
command queue, its own sync cursor.
Does NOT know: other users' data, audit details, Admin's internal schema.

### 3.4 Internal Infrastructure

Owner: our ops team.
Stack: Prometheus + Grafana + Loki + Tempo + Infisical + Woodpecker CI + Docker Compose.
Knows: how the Cloud runs, who has access, what's deployed, what broke.
Does NOT know: business data, customer content.

---

## 4. The authority model

    YOUR TEAM
      |
      v
    CLOUD PLATFORM  <- platform authority
    (accounts, devices, projects, modules, audit, billing)
      |
      v  control plane (HTTPS, NOT in data path)
      |
    ADMIN  <- project authority
    (project truth, users, modules, outbox, audit)
      |
      v  project network (LAN: mDNS + WireGuard; WAN: direct / relay)
      |
    USER  <- projection only
    (authorized view, local cache, command queue)

| Question | Answer |
|---|---|
| Who owns business data? | Admin. Always. |
| Who controls user permissions? | Admin. Cloud only knows that a user is a member. |
| Who can sign a module? | Cloud (private channel). |
| Who publishes a new module? | Platform owner, via private channel. No third-party in v1. |
| Who can replace the Admin device? | Cloud, after strong recovery verification. |
| What if Admin is offline? | Users can read cached data. They cannot write. |
| What if Cloud is offline? | Admin continues. Users can read. Backup, module install, account ops pause. |

---

## 5. Communication paths

Four transport paths between Admin and User. Application doesn't care
which is in use. Mesh is our own implementation (no Tailscale, no
Headscale, no third-party VPN - see ADR-017).

| Priority | Method | When | Privacy |
|---|---|---|---|
| 1 | Direct LAN (mDNS + WireGuard) | Same network | 100% local |
| 2 | Direct internet (WireGuard over IPv6 or static IPv4) | Both have public IPs | 100% direct |
| 3 | NAT traversal (outbound-initiated, hole-punch) | One side public, other NAT | 100% direct after hole-punch |
| 4 | Customer-hosted relay | Both behind CGNAT | Customer's own server, opt-in |

The Cloud is NEVER in the data path. It is only in the control path
(auth, discovery, signing, audit, backup-receive, update-publish). The
discovery service knows device public IP -> virtual IP mapping but never
sees message contents.

---

## 6. The first two business modules

| Module | Scope | Operations |
|---|---|---|
| medical-reception | One doctor + N staff. NOT a full clinic EMR. | patients, appointments, basic visit notes (SOAP), prescriptions |
| food-lab | Sample -> test -> analysis -> result -> report. | samples, tests, results, reports, lab workflow |

Both are WASM artifacts, signed by the Cloud, licensed per project.
v1 ships exactly these two.

---

## 7. Plans

| Feature | Local | Starter | Team | Enterprise |
|---|---|---|---|---|
| Admin user count | 1 | 1 | 1 | 1 |
| Project count | 1 | 1 | 1 | multiple |
| User count | 0 | up to 3 | up to 10 | unlimited |
| Cloud backup | no | daily | daily | daily + manual |
| Backup storage quota | - | 50 GB | 500 GB | 5 TB |
| Custom modules | no | no | no | yes |
| Audit retention | local | 1 year | 5 years | forever |

Enforcement is at the Cloud boundary for Cloud-mediated operations and at
the Admin for local operations. The User app is plan-agnostic.

---

## 8. User flow (first run)

    1. Auth page      - sign in (or sign up with an invitation token)
    2. Build project  - 4 fields: name, admin last name, business type, business name
    3. Plan picker    - Local / Starter / Team / Enterprise
    4. Project picker - select existing or create new
    5. Main app shell loads
    6. Project opens
    7. Modules load (medical-reception / food-lab)

Returning customer: skip steps 2-3.

---

## 9. Roles

Admin defines roles (Doctor, Receptionist, Lab Analyst, etc.). Many users
can share a role. Effective permissions are the union of all roles.

Cloud does not know the per-role permission list (only the Admin does).
Cloud knows which user is member of which project and which role IDs are
assigned (for module access checks).

---

## 10. User signup (empty account -> admin assigns)

    1. Admin issues an invitation (email + role + module access)
    2. Cloud creates the invitation token, sends to the user
    3. User signs up at the signup page with the token
    4. Cloud creates an EMPTY account (no project membership yet)
    5. User's app shows "Waiting for Admin"
    6. When Admin is online, Admin sees "1 new user waiting to be assigned"
    7. Admin assigns user to project + role + module access
    8. User is a real member; their app shows the project

Cloud is the auth provider. Admin is the gatekeeper.

---

## 11. Corbeille (forever soft-delete)

Soft-deleted records are held per the plan's quota (Local: local only;
Starter: 5 GB; Team: 50 GB; Enterprise: 500 GB). When quota is reached,
the oldest soft-deleted record is hard-deleted (30-day recovery grace).
Customer can restore any soft-deleted record.

Cloud stores deletion metadata for compliance. Admin holds the actual
soft-deleted data.

---

## 12. The live heart

Cloud is authoritative for updates - not just app updates but schema
migrations, data patches (specific SQL), and logic changes. Updates are
signed, versioned, applied in a transaction with rollback. Critical
updates have a deadline (Admin refuses to start if not applied).

---

## 13. How to read this document set

    docs/architecture/
      00-OVERVIEW.md           <- you are here
      01-PRINCIPLES.md         <- 13 non-negotiable rules
      02-DECISIONS/            <- ADRs
      03-STACK.md              <- exact tools, versions, why
      04-GLOSSARY.md           <- shared vocabulary
      05-FEATURES.md
      06-MIGRATIONS.md
      07-PERFORMANCE.md
      STATUS-REPORT.md
      SYNC-PROTOCOL.md

If something in the code disagrees with this doc set, the doc set wins
until an ADR supersedes it. Any architecture change is an ADR.