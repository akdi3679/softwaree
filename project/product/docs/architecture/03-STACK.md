# Stack - Tools, Versions, And Why

> **Status:** Locked
> **Note:** recovered from an earlier draft in the wiring session.

Every tool has been chosen for enterprise track record, self-hostability,
security posture, or community size. We do not pick tools because they
are trendy.

---

## A. Cloud Platform (platform-cloud/)

| Layer | Tool | Version | Why |
|---|---|---|---|
| Runtime | Node.js (LTS) | 22.x | Stable, LTS, ecosystem |
| Language | TypeScript | 5.6+ | Strict, shared contracts |
| Web framework | Hono | 4.x | 12kb, Web Standards, fast |
| Validation | Zod | 3.x | Type-safe, shared with product |
| ORM | Drizzle | 0.36+ | TS-first, no runtime reflection |
| Database | PostgreSQL | 16 | Row-Level Security, mature |
| Migrations | Drizzle Kit | latest | Schema-as-code |
| Object storage | MinIO | RELEASE.2024+ | S3-compatible, self-hosted |
| Background jobs (v2) | NATS JetStream | 2.10+ | Not used in v1 |
| Search (if needed) | Meilisearch | 1.10+ | Sub-50ms, self-hostable |
| Secrets (dev) | .env + gitignore | - | - |
| Secrets (prod) | Infisical | latest | Open-source Vault alternative |
| Container | Docker | 24+ | Standard |
| Orchestration (v1) | Docker Compose | - | Compose until team > 3 ops |
| Orchestration (v2) | Kubernetes | - | Only when needed |

Why Hono over Express/Fastify/Next.js:

- 12kb vs Express 1.4MB
- Web Standards (runs on any runtime)
- 3x throughput vs Fastify
- No framework lock-in
- Perfect for a JSON API

Why Drizzle over Prisma:

- No separate schema file, no codegen
- SQL-like API (easier to optimize)
- Smaller bundle
- Fewer runtime deps

Why modular monolith over microservices: each microservice adds deploy,
networking, auth, monitoring, failure modes. Start monolithic. Extract
when team grows.

---

## B. Admin Application (product/apps/admin/)

| Layer | Tool | Version | Why |
|---|---|---|---|
| Shell | Tauri | 2.x | 5-15MB binary, keychain access |
| Frontend | React | 19 | Mature, known by team |
| Build | Vite | 5.x | Instant HMR, ESM-native |
| Routing | TanStack Router | 1.x | Type-safe, file-based |
| Data fetching | TanStack Query | 5.x | Reactive queries on SQLite |
| Forms | React Hook Form + Zod | latest | Type-safe end-to-end |
| Styling | Tailwind CSS | 4.x | No runtime |
| Primitives | Radix UI | latest | Headless, accessible |
| UI state | Zustand | 5.x | Only for UI state |
| Backend language | Rust | 1.80+ | Security-critical code |
| Database | SQLite | 3.46+ | Embedded, ACID |
| DB driver | rusqlite + r2d2 | latest | Mature |
| Type bridge | specta | 2.x | Export Rust types to TS |
| Migrations | SQL files + sqlx::migrate! | - | Simple, forward-only |
| Module runtime | Wasmtime | 27+ | Capability-based, ~5ms cold start |
| Module language | Rust -> wasm32-wasip2 | - | Same language as host |
| Mesh encryption | WireGuard | built-in | Kernel, E2E |
| LAN discovery | mDNS (Avahi/Bonjour) | built-in | RFC 6762 |
| Auto-update | tauri-plugin-updater | 2.x | Signed bundles |
| Logging (Rust) | tracing + tracing-subscriber | latest | Structured, OTel-compatible |
| Logging (TS) | pino | 9.x | Fastest Node logger |
| Errors (Rust) | thiserror + anyhow | latest | Idiomatic |
| Lint/format (TS) | Biome | 1.9+ | One tool, 10x faster |
| Lint (Rust) | clippy + rustfmt | latest | Standard |
| Testing (TS) | Vitest | 2.x | Fast, ESM-native |
| Testing (Rust) | cargo test + nextest | latest | Standard |
| E2E | Playwright + Tauri driver | latest | Real WebView |

Why Tauri over Electron: 5-15MB vs 150MB; ~30MB RAM vs 200MB+; native
integration; capability-based security; Rust backend.

Why Vite + React, not Next.js: Tauri serves static files. No server.
Next.js SSR/RSC/Server Actions are unused weight.

---

## C. User Application (product/apps/user/)

Same stack as Admin, smaller surface:

- Wasmtime module runtime (restricted: read-only projection + command submission)
- Module management UI: view only
- Smaller command set
- No backup management UI
- No user/role management UI
- No audit log UI

The User app is a strict subset of the Admin app. Build Admin UI first;
User composes with fewer features.

---

## D. Shared Contracts (product/packages/contracts/)

Pure-TypeScript package. No runtime. Types, Zod schemas, generated code.

| Tool | Why |
|---|---|
| TypeScript 5.6+ | Strict, type-only |
| Zod 3.x | Runtime validation matching types |
| TypeDoc | API docs |
| Changesets | Versioning per package |

Exports:

- Branded ID types (ProjectId, UserId, DeviceId, CommandId, EventId, ModuleId)
- Command envelope, Event envelope, Query envelope
- Error contracts (ValidationError, AuthorizationError, ConflictError, NetworkError)
- Domain enums (project state, device state, module state)
- Versioning primitives (ProjectSequence, AggregateVersion)
- Cloud API contract types

Cloud imports from this package. Admin and User import from this package.
Cloud does NOT import from anywhere else in product/.

---

## E. Internal Infrastructure (internal-infra/)

| Tool | Version | Why |
|---|---|---|
| Prometheus | 2.50+ | Metrics |
| Grafana | 11+ | Dashboards |
| Loki | 3+ | Logs |
| Tempo | 2+ | Traces |
| OpenTelemetry Collector | latest | Unified ingest |
| Infisical | latest | Secrets |
| Woodpecker CI | 2.x | Self-hosted CI |
| Gitea | 1.22+ | Self-hosted Git |
| MinIO | RELEASE.2024+ | Backups |
| Docker Compose | 24+ | Local + small prod |
| Caddy | 2.x | Reverse proxy, auto HTTPS |

Why self-hosted: minimum cost, full data control, no vendor lock-in.
We pay for compute, not for the privilege of running our own software.

Why not Kubernetes yet: Compose is faster, simpler, easier to debug for
a 2-3 person ops team on one Cloud instance. Migrate when team > 3 ops
or we need multi-region.

---

## F. Languages

| Where | Language | Why |
|---|---|---|
| Cloud API | TypeScript | Type safety + Node ecosystem |
| Cloud infra scripts | TypeScript | Same as Cloud |
| Admin frontend | TypeScript + React | Team knows it |
| Admin backend | Rust | Security-critical, Tauri requires it |
| User frontend | TypeScript + React | Same as Admin |
| User backend | Rust | Same as Admin |
| Modules | Rust -> WASM | Performance, safety |
| Scripts | TypeScript or Bash | Standard |

Deliberately not used:

- Go - would split the team
- Python - not needed in v1
- Java/Kotlin - operational cost too high
- C#/.NET - no benefit over Rust

---

## G. Versioning

| What | How | Cadence |
|---|---|---|
| Cloud API | Semver, /v1/... in URL, never break v1 | Continuous |
| Admin app | Semver, auto-update via tauri-plugin-updater | Bi-weekly |
| User app | Same as Admin, shipped together | Bi-weekly |
| Modules | Independent semver, license-bound to project + plan | Per release |
| Contracts | Changesets, semver | Continuous |
| Cloud DB schema | Forward-only migrations | Per change |
| Admin/User DB schema | Forward-only migrations | Per change |

API compatibility: v1 stable forever. New features go to v2. Deprecations
announced 6 months before removal. No silent breaking changes.

---

## H. Cost Estimate (self-hosted, 1000 active projects)

| Item | Monthly |
|---|---|
| Cloud VM (4 vCPU, 16GB) | $80 |
| PostgreSQL (managed or self-hosted) | $0-100 |
| MinIO storage (1 TB) | $25 |
| Domain + DNS | $2 |
| Monitoring (self-hosted) | $20 |
| CI runner (self-hosted) | $20 |
| **Total** | **~$150/month for 1000 projects** |

At 10K projects: $400-600/month. At 1M projects: real K8s + CDN, but
per-user cost is pennies. Dramatically cheaper than SaaS at scale.