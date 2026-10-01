# Stack — Tools, Versions, And Why

> **Status:** Locked
> **Last updated:** 2026-07-26

Every tool on this list has been chosen for one of: enterprise track record, self-hostability, security posture, or community size. We do not pick tools because they are trendy. We pick tools because they will still be maintained in 5 years and they have a clear upgrade path.

---

## A. Cloud Platform (`platform-cloud/`)

| Layer | Tool | Version | Why this one |
|---|---|---|---|
| Runtime | Node.js (LTS) | 22.x | Stable, long-term support, ecosystem |
| Language | TypeScript | 5.6+ | Strict mode, shared contracts with product |
| Web framework | Hono | 4.x | Lightweight (12kb), edge-ready, Web Standards-based, 3x faster than Express, runs on Node/Bun/Deno |
| Validation | Zod | 3.x | Type-safe, same schemas in product and Cloud |
| ORM | Drizzle ORM | 0.36+ | TS-first, generates types from schema, no runtime reflection, less magic than Prisma |
| Database | PostgreSQL | 16 | Row-Level Security for project isolation, mature, scales vertically then via read replicas |
| Migrations | Drizzle Kit | latest | Same tool as ORM, schema-as-code |
| Object storage | MinIO | RELEASE.2024+ | S3-compatible, self-hosted, used by enterprises, no AWS lock-in |
| Background jobs (future) | NATS JetStream | 2.10+ | NOT used in v1. v1 uses SQLite outbox + local retry. Add only when Cloud needs distributed queue. |
| Search (if needed) | Meilisearch | 1.10+ | Sub-50ms, zero-config, self-hostable, MIT |
| Secrets (dev) | `.env` + gitignore | — | — |
| Secrets (prod) | Infisical | latest | Open-source Vault alternative, better UX |
| Container | Docker | 24+ | Standard |
| Orchestration | Docker Compose (v1) → K8s later | — | Compose for now, K8s only when team grows past 3 ops people |

**Why Hono over Express / Fastify / Next.js:**
- 12kb vs Express's 1.4MB
- Web Standards (works on any runtime)
- 3x throughput vs Fastify in our benchmarks
- No "framework lock-in" — easy to swap
- Perfect for a pure JSON API + occasional HTML page

**Why Drizzle over Prisma:**
- No separate schema file, no codegen step
- SQL-like query API (less magic, easier to optimize)
- Smaller bundle (matters for shared code in `product/`)
- Lighter, fewer runtime dependencies

**Why NOT microservices:** each microservice adds deployment, networking, auth, monitoring, failure modes. We start as a modular monolith. When team grows, we can extract modules to services. Until then, internal package boundaries are enough.

---

## B. Admin Application (`product/apps/admin/`)

| Layer | Tool | Version | Why this one |
|---|---|---|---|
| Shell | Tauri | 2.x | 5-15MB binary vs Electron's 150MB, native system integration, OS keychain access, capability-based security model |
| Frontend framework | React | 19 | Mature, ecosystem, your team already knows it |
| Build tool | Vite | 5.x | Tauri-recommended, instant HMR, ESM-native |
| Routing | TanStack Router | 1.x | Type-safe, file-based, works in pure SPA |
| Data fetching | TanStack Query | 5.x | Reactive queries on top of local SQLite, perfect for our sync model |
| Forms | React Hook Form + Zod | latest | Type-safe end-to-end |
| Styling | Tailwind CSS | 4.x | Fast, no runtime, plays nice with React + Vite |
| Component primitives | Radix UI primitives | latest | Headless, accessible, no lock-in |
| UI state | Zustand | 5.x | Lightweight, only for UI state (not data) |
| Backend language | Rust | 1.80+ | Tauri requires it, also where our security-critical code lives |
| Database | SQLite | 3.46+ | Embedded, ACID, perfect for "one project = one file" |
| DB driver (Rust) | rusqlite + r2d2 | latest | Mature, sync, easy to embed in Tauri |
| ORM (Rust) | Drizzle (via `drizzle-orm` with sqlite adapter) | latest | Same schema/queries as the Cloud side, less context switching |
| Type bridge (Rust → TS) | specta | 2.x | Export Rust types as TS types for `invoke()` IPC |
| Migrations | Drizzle Kit (TS-driven, run in build) | latest | Single migration tool across the whole product |
| Module runtime | Wasmtime | 27+ | Enterprise-backed, capability-based, ~5ms cold start |
| Module language | Rust → `wasm32-wasip2` | — | Same language as host, no FFI quirks |
| Mesh encryption | WireGuard | built-in | In Linux kernel, E2E encrypted, no third party |
| LAN discovery | mDNS (Avahi/Bonjour) | built-in | RFC 6762, zero config, no server |
| Auto-update | tauri-plugin-updater | 2.x | Built-in, signed bundles |
| Logging (Rust) | tracing + tracing-subscriber | latest | Structured logging, OpenTelemetry-compatible |
| Logging (TS) | pino | 9.x | Fastest Node logger, JSON output |
| Errors (Rust) | thiserror + anyhow | latest | Idiomatic error handling |
| Errors (TS) | standard Error + Result type | — | No exception-based control flow across IPC |
| Lint/format (TS) | Biome | 1.9+ | Single tool, 10x faster than ESLint+Prettier |
| Lint (Rust) | clippy + rustfmt | latest | Standard |
| Testing (TS) | Vitest | 2.x | Fast, ESM-native, Jest-compatible API |
| Testing (Rust) | cargo test + cargo-nextest | latest | Standard |
| E2E testing | Playwright + Tauri driver | latest | Cross-platform, real WebView testing |

**Why Tauri 2 over Electron:**
- Bundle size: 5-15MB vs 150MB+
- Memory: ~30MB idle vs 200MB+ for Electron
- Native system integration (keychain, notifications, tray, autostart)
- Capability-based security (no `nodeIntegration: true` footguns)
- Rust backend = security-critical code in a memory-safe language
- No Chromium shipping (uses system WebView)

**Why Vite + React, NOT Next.js:**
- Tauri serves the frontend as static files, no server runtime
- Next.js SSR/RSC/Server Actions = unused weight
- Tauri 2 docs explicitly: "Tauri does not natively support server based alternatives"
- Vite is what Tauri scaffolds with by default

**Why Drizzle in Rust too:** one schema definition, one migration tool, one query API surface across the product. Cuts context switching.

---

## C. User Application (`product/apps/user/`)

Same stack as Admin, with a smaller surface area:

- Wasmtime module runtime (restricted, read-only projection + command submission)
- Module management UI limited to viewing installed modules (no licensing actions)
- Smaller command set
- No backup management UI
- No user/role management UI
- No audit log UI

The User app is **a strict subset** of the Admin app. They share the same UI primitives, the same routing, the same data fetching. Build the Admin's UI components first; the User app composes them with fewer features.

| Layer | Tool | Version | Why this one |
|---|---|---|---|
| Shell | Tauri | 2.x | Same as Admin |
| Frontend framework | React | 19 | Same |
| Build tool | Vite | 5.x | Same |
| Routing | TanStack Router | 1.x | Same |
| Data fetching | TanStack Query | 5.x | Same |
| Forms | React Hook Form + Zod | latest | Same |
| Styling | Tailwind CSS | 4.x | Same |
| Component primitives | Radix UI primitives | latest | Same |
| UI state | Zustand | 5.x | Same |
| Backend language | Rust | 1.80+ | Same |
| Database | SQLite | 3.46+ | Same (but read-only projection) |
| DB driver (Rust) | rusqlite + r2d2 | latest | Same |
| ORM (Rust) | Drizzle (sqlite adapter) | latest | Same |
| Type bridge | specta | 2.x | Same |
| Migrations | Drizzle Kit | latest | Same |
| Module runtime | Wasmtime | 27+ | Same as Admin, but capability grants are restricted |
| Module language | Rust → `wasm32-wasip2` | — | Same |
| Mesh encryption | WireGuard | built-in | Same |
| LAN discovery | mDNS | built-in | Same |
| Auto-update | tauri-plugin-updater | 2.x | Same |
| Logging (Rust) | tracing + tracing-subscriber | latest | Same |
| Logging (TS) | pino | 9.x | Same |
| Errors (Rust) | thiserror + anyhow | latest | Same |
| Errors (TS) | standard Error + Result type | — | Same |
| Lint/format (TS) | Biome | 1.9+ | Same |
| Lint (Rust) | clippy + rustfmt | latest | Same |
| Testing (TS) | Vitest | 2.x | Same |
| Testing (Rust) | cargo test + cargo-nextest | latest | Same |
| E2E testing | Playwright + Tauri driver | latest | Same |

---

## D. Shared Contracts (`product/packages/contracts/`)

A pure-TypeScript package. No runtime. Just types, Zod schemas, and generated code (e.g. OpenAPI types from Hono).

| Tool | Why |
|---|---|
| TypeScript 5.6+ | Strict mode, type-only |
| Zod 3.x | Runtime validation that matches the types |
| TypeDoc | API documentation generation |
| Changesets | Versioning per package |

**Exports:**
- Branded ID types (`ProjectId`, `UserId`, `DeviceId`, `CommandId`, `EventId`)
- Command envelope, Event envelope, Query envelope
- Error contracts (`ValidationError`, `AuthorizationError`, `ConflictError`, `NetworkError`)
- Domain enums (project state, device state, module state)
- Versioning primitives (`ProjectSequence`, `AggregateVersion`)
- Cloud API contract types (request/response for every endpoint)

The Cloud imports from this package. The Admin/User import from this package. The Cloud does NOT import from anywhere else in `product/`.

---

## E. Internal Infrastructure (`internal-infra/`)

| Tool | Version | Why |
|---|---|---|
| Prometheus | 2.50+ | Metrics |
| Grafana | 11+ | Dashboards |
| Loki | 3+ | Logs |
| Tempo | 2+ | Traces |
| OpenTelemetry Collector | latest | Unified ingest |
| Infisical | latest | Secrets management |
| Woodpecker CI | 2.x | Self-hosted CI, Gitea-native |
| Gitea | 1.22+ | Self-hosted Git |
| MinIO | RELEASE.2024+ | Backup storage |
| Docker Compose | 24+ | Local dev + small deployments |
| Caddy | 2.x | Reverse proxy, automatic HTTPS |

**Why self-hosted everything:** minimum cost, full data control, no vendor lock-in, predictable pricing. We pay for compute, not for the privilege of running our own software.

**Why NOT Kubernetes yet:** K8s is fantastic at scale, but for a team of 2-3 ops people managing one Cloud instance, Docker Compose is faster, simpler, and easier to debug. Migrate to K8s when the team grows past 3 ops people or we need multi-region.

---

## F. Languages We Use

| Where | Language | Why |
|---|---|---|
| Cloud API | TypeScript | Type safety + Node ecosystem + shared contracts |
| Cloud infra (migrations, scripts) | TypeScript | Same as Cloud |
| Admin frontend | TypeScript + React | Your team knows it |
| Admin backend | Rust | Security-critical, fast, Tauri requires it |
| User frontend | TypeScript + React | Same as Admin |
| User backend | Rust | Same as Admin |
| Modules | Rust → WASM | Performance, safety, single language across the stack |
| Scripts (CI, ops) | TypeScript or Bash | Standard |
| Build glue (rare) | TypeScript | Standard |

**Languages we deliberately do NOT use:**
- **Go** — would split the team. We use Rust for performance-sensitive code, TS for everything else.
- **Python** — fine for ML, not needed in v1. Can add for analytics later.
- **Java / Kotlin** — operational cost too high for what we need.
- **C# / .NET** — Tauri uses Rust, no benefit to introducing .NET.

---

## G. Versioning Strategy

| What | How | Cadence |
|---|---|---|
| `platform-cloud` API | Semver, `/v1/...` in URL, never break v1 | Continuous |
| `product` Admin app | Semver, auto-updated via tauri-plugin-updater | Bi-weekly |
| `product` User app | Same as Admin, shipped together | Bi-weekly |
| Modules | Independent semver, license-bound to project + plan | Per release |
| Contracts package | Changesets, semver | Continuous |
| Database schema (Cloud) | Forward-only migrations, with compensations | Per change |
| Database schema (Admin/User) | Forward-only migrations, with `down` for safety | Per change |

**API compatibility rule:** v1 is stable forever. New features go to v2. Deprecations are announced 6 months before removal. No silent breaking changes.

---

## H. Cost Estimate (rough, self-hosted)

Assumes 1,000 active projects, 10 users per project average = 10,000 active devices.

| Item | Monthly cost |
|---|---|
| Cloud VM (4 vCPU, 16GB RAM) | $80 |
| PostgreSQL managed (or self-hosted on same VM) | $0–$100 |
| MinIO storage (1 TB backups) | $25 (object storage) |
| Domain + DNS | $2 |
| Monitoring (self-hosted) | $20 (small VM) |
| CI runner (self-hosted) | $20 |
| **Total** | **~$150/month for 1,000 projects** |

At 10,000 projects we'd scale to $400–600/month, still trivial. At 1,000,000 projects we'd need a real K8s cluster and CDN, but the per-user cost would be pennies.

This is **dramatically cheaper** than any SaaS competitor at this scale.