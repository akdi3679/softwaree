# Stack — Tools, Versions, And Why

> **Status:** Locked
> **Last updated:** 2026-11-20

Every tool here was chosen for one of: enterprise track record, self-hostability, security posture, or community size. We do not pick tools because they are trendy. We pick tools that will still be maintained in five years and have a clear upgrade path.

**Version policy.** Versions below are **floors and targets, not gospel**. Every pin is verified against the project's official release page at **Phase 0** and recorded in the lockfiles. Rows marked *(pin at Phase 0)* are deliberately unpinned here rather than carrying a stale number. No performance claim appears in this document without our own measurement.

---

## A. Cloud Platform (`platform-cloud/`)

| Layer | Tool | Version | Why this one |
|---|---|---|---|
| Runtime | Node.js (LTS) | 24.x *(pin at Phase 0)* | Active LTS, long support window, ecosystem |
| Language | TypeScript | 5.9+ *(pin at Phase 0)* | Strict mode, shared contracts with the product |
| Web framework | Hono | 4.x | Lightweight (~12 kb), Web Standards, runs on Node/Bun/Deno, no framework lock-in |
| Validation | Zod | 4.x *(pin at Phase 0)* | Type-safe schemas shared with the product |
| ORM | Drizzle ORM | *(pin at Phase 0)* | TS-first, types from schema, SQL-like API, less magic than Prisma. **Cloud only — Drizzle has no Rust version.** |
| Database | PostgreSQL | 17+ *(pin major at Phase 0)* | Mature, RLS for control-plane tenant scoping, scales vertically then via replicas |
| Migrations | Drizzle Kit | *(pin at Phase 0)* | Schema-as-code, same tool as the ORM |
| Object storage | MinIO | *(pin at Phase 0)* | S3-compatible, self-hosted, no AWS lock-in |
| **Signing & escrow keys** | **HSM / cloud KMS** | — | Cloud root, signing-service, per-project licence keys, and the assisted-mode Escrow Key (ADR-022). Patch key stays **offline** (ADR-015). |
| **Email delivery** | SMTP (self-hosted) or Postmark / SES | — | Invitations, recovery alerts, dunning, receipts. Recovery alerts are security-critical, not marketing mail. |
| **Payments** | Stripe | latest API | Checkout + signature-verified, idempotent webhooks (ADR-014) |
| **STUN / probe** | coturn (or equivalent) | *(pin at Phase 0)* | Our own reachability servers — no third party by default (ADR-019) |
| **Blind relay** | our packet forwarder | — | Opt-in, ciphertext only, no key material, metered per project (ADR-024) |
| Canonical JSON (TS) | `canonicalize` (JCS, RFC 8785) | *(pin at Phase 0)* | One hash rule with the Rust side (Principle 11) |
| Rate limiting | in-process + Postgres counters | — | 1000 req/min/account; discovery 1 heartbeat/min/device |
| Background jobs (future) | NATS JetStream | — | **Not used in v1.** v1 uses the SQLite outbox + local retry. Add only when the Cloud needs a distributed queue. |
| Search (if needed) | Meilisearch | *(pin at Phase 0)* | Sub-50 ms, zero-config, self-hostable |
| Secrets (dev) | `.env` + gitignore | — | — |
| Secrets (prod) | Infisical | *(pin at Phase 0)* | Open-source Vault alternative, better UX |
| Container | Docker | 24+ | Standard |
| Orchestration | Docker Compose (v1) → K8s later | — | Compose now; K8s when the team passes ~3 ops people or we need multi-region |

**Why Hono over Express / Fastify / Next.js**
- ~12 kb vs Express's ~1.4 MB
- Web Standards: works on any runtime
- No framework lock-in — easy to swap
- Right shape for a pure JSON API plus the occasional HTML page
- **No benchmark claims here.** We run our own throughput tests at Phase 0 before relying on any number.

**Why Drizzle over Prisma (Cloud side)**
- No separate schema file, no codegen step
- SQL-like query API, easier to optimize
- Smaller footprint, fewer runtime dependencies

**Why not microservices:** each service adds deployment, networking, auth, monitoring and failure modes. We start as a modular monolith with hard internal package boundaries. The **one exception is the signing service**, which is a separate process by design (Principle 13), and the **Owner Console**, which is separate for network isolation (ADR-013).

---

## B. Admin Application (`product/apps/admin/`)

| Layer | Tool | Version | Why this one |
|---|---|---|---|
| Shell | Tauri | 2.x | 5–15 MB binary vs Electron's ~150 MB, native integration, OS keychain, capability-based security |
| Frontend framework | React | 19 | Mature, ecosystem, team already knows it |
| Build tool | Vite | 7.x *(pin at Phase 0)* | Tauri-recommended, instant HMR, ESM-native |
| Routing | TanStack Router | 1.x | Type-safe, file-based, works in a pure SPA |
| Data fetching | TanStack Query | 5.x | Reactive queries over local SQLite — fits the projection model |
| Forms | React Hook Form + Zod | *(pin at Phase 0)* | Type-safe end to end |
| Styling | Tailwind CSS | 4.x | Fast, no runtime, plays well with React + Vite |
| Component primitives | Radix UI primitives | *(pin at Phase 0)* | Headless, accessible, no lock-in |
| UI state | Zustand | 5.x | Lightweight, UI state only — never data |
| Backend language | Rust | stable *(pin at Phase 0)* | Tauri requires it; all security-critical code lives here |
| Database | SQLite + **SQLCipher** | 3.46+ / SQLCipher 4.x | Embedded, ACID, encrypted at rest. **SEE is commercial and is not used** (ADR-005). |
| DB driver (Rust) | `rusqlite` (`bundled-sqlcipher`) + `r2d2` | *(pin at Phase 0)* | Mature, synchronous, embeds cleanly in Tauri |
| DB access (Rust) | **plain SQL** | — | **Drizzle is TypeScript-only; it does not exist for Rust.** Queries are plain SQL; types come from `specta` + contracts. |
| Migrations (Rust) | `.sql` files + `rusqlite_migration` | *(pin at Phase 0)* | Embedded in the binary, **forward-only**, run per project on start (ADR-005) |
| Type bridge (Rust → TS) | `specta` | 2.x | Export Rust types as TS types for `invoke()` IPC |
| Module runtime | Wasmtime | *(pin at Phase 0)* | Bytecode Alliance, capability-based, ~5 ms cold start |
| Module language | Rust → `wasm32-wasip2` | — | Same language as the host, no FFI quirks |
| Module UI | static JS/CSS in a sandboxed iframe | — | Opaque origin, nonce CSP, typed `postMessage` bridge (ADR-011) |
| **Mesh encryption** | **WireGuard in userspace** (`boringtun` or an actively maintained equivalent) + `smoltcp` | *(pin at Phase 0)* | **No driver, no adapter, no admin rights.** Works identically on Windows/macOS/Linux (ADR-024). |
| **LAN discovery** | mDNS via a **pure-Rust** library (e.g. `mdns-sd`) | *(pin at Phase 0)* | RFC 6762, zero config. **Avahi does not exist on Windows** — pure Rust works everywhere. |
| STUN client | our own client → our own servers | — | Reachability self-test with an **external probe**, never self-connect (ADR-019) |
| Crypto (Rust) | `ring` or **`aws-lc-rs`**; `argon2`; `keyring` | *(pin at Phase 0)* | Standard algorithms only. `aws-lc-rs` — not "aws-ls-crypto". |
| Canonical JSON (Rust) | `serde_jcs` (RFC 8785) | *(pin at Phase 0)* | Audit chain + bundle hashing (Principle 11, ADR-007) |
| **PDF generation** | `typst` or `printpdf` | *(pin at Phase 0)* | Sick-leave certificates, lab reports |
| Auto-update | `tauri-plugin-updater` | 2.x | Built-in, signed bundles |
| **Code signing** | Apple notarization, Windows Authenticode, Linux GPG | — | Certificates procured at Phase 0; EV recommended on Windows |
| Logging (Rust) | `tracing` + `tracing-subscriber` | *(pin at Phase 0)* | Structured, OpenTelemetry-compatible |
| Logging (TS) | `pino` | 9.x | Fast, JSON output |
| Errors (Rust) | `thiserror` + `anyhow` | *(pin at Phase 0)* | Idiomatic error handling |
| Errors (TS) | standard `Error` + `Result` type | — | No exception-based control flow across IPC |
| Lint/format (TS) | Biome | 2.x *(pin at Phase 0)* | One tool for lint + format |
| Lint (Rust) | `clippy` + `rustfmt` | stable | Standard |
| Testing (TS) | Vitest | 3.x *(pin at Phase 0)* | Fast, ESM-native, Jest-compatible API |
| Testing (Rust) | `cargo test` + `cargo-nextest` | *(pin at Phase 0)* | Standard |
| E2E testing | Playwright + Tauri driver | *(pin at Phase 0)* | Cross-platform, real WebView |

**Why Tauri 2 over Electron**
- Bundle 5–15 MB vs 150 MB+
- ~30 MB idle vs 200 MB+
- Native keychain, notifications, tray, autostart
- Capability-based security — no `nodeIntegration: true` footguns
- Security-critical code in a memory-safe language
- No bundled Chromium (uses the system WebView)

**Why Vite + React, not Next.js**
- Tauri serves the frontend as static files; there is no server runtime
- SSR/RSC/Server Actions would be unused weight
- Tauri's own docs say server-based alternatives are not natively supported
- Vite is what Tauri scaffolds by default

**Why plain SQL in Rust, not Drizzle**
Drizzle is a TypeScript library. There is no Rust version, and pretending otherwise produces a stack that cannot be built. The Admin and User use `rusqlite` with embedded `.sql` migration files. Contract types are shared through the contracts package and `specta`; the SQL itself is deliberately boring and auditable. **Drizzle stays Cloud-only.**

**Why userspace WireGuard, not the kernel module**
Our customers run Windows. Kernel WireGuard there needs a driver and administrator rights, which contradicts a standard-user installer, and a system adapter would fight real LANs using `10.50.x.x`. In userspace, the addresses live inside our own stack, no OS route is touched, and one implementation covers all three platforms (ADR-024).

---

## C. User Application (`product/apps/user/`)

Same stack as the Admin, with a smaller surface:
- Wasmtime with **restricted** grants (authorized projection reads + command submission)
- Module management is view-only — no licensing actions
- Smaller command set
- No backup management, no role management, no audit-log UI
- **No command queue in v1** (ADR-009)

Build the Admin's UI components first; the User app composes them with fewer features.

| Layer | Tool | Version | Why this one |
|---|---|---|---|
| Shell | Tauri | 2.x | Same as Admin |
| Frontend framework | React | 19 | Same |
| Build tool | Vite | 7.x *(pin at Phase 0)* | Same |
| Routing | TanStack Router | 1.x | Same |
| Data fetching | TanStack Query | 5.x | Same |
| Forms | React Hook Form + Zod | *(pin at Phase 0)* | Same |
| Styling | Tailwind CSS | 4.x | Same |
| Component primitives | Radix UI primitives | *(pin at Phase 0)* | Same |
| UI state | Zustand | 5.x | Same |
| Backend language | Rust | stable *(pin at Phase 0)* | Same |
| Database | SQLite + SQLCipher | 3.46+ / 4.x | Same — projection tables only, still encrypted |
| DB driver (Rust) | `rusqlite` (`bundled-sqlcipher`) + `r2d2` | *(pin at Phase 0)* | Same |
| DB access (Rust) | plain SQL | — | Same (Drizzle is TS-only) |
| Migrations (Rust) | `.sql` + `rusqlite_migration` | *(pin at Phase 0)* | Same |
| Type bridge | `specta` | 2.x | Same |
| Module runtime | Wasmtime | *(pin at Phase 0)* | Same, restricted capability grants |
| Module UI | sandboxed iframe + bridge | — | Same, fewer allowed methods |
| Module language | Rust → `wasm32-wasip2` | — | Same |
| Mesh encryption | WireGuard userspace + `smoltcp` | *(pin at Phase 0)* | Same |
| LAN discovery | mDNS (pure-Rust) | *(pin at Phase 0)* | Same |
| STUN client | ours | — | Same |
| Crypto (Rust) | `ring` / `aws-lc-rs`, `argon2`, `keyring` | *(pin at Phase 0)* | Same |
| Canonical JSON (Rust) | `serde_jcs` | *(pin at Phase 0)* | Snapshot + frame verification |
| Auto-update | `tauri-plugin-updater` | 2.x | Same |
| Code signing | Apple / Windows / Linux | — | Same |
| Logging (Rust) | `tracing` | *(pin at Phase 0)* | Same |
| Logging (TS) | `pino` | 9.x | Same |
| Errors (Rust) | `thiserror` + `anyhow` | *(pin at Phase 0)* | Same |
| Errors (TS) | `Error` + `Result` | — | Same |
| Lint/format (TS) | Biome | 2.x *(pin at Phase 0)* | Same |
| Lint (Rust) | `clippy` + `rustfmt` | stable | Same |
| Testing (TS) | Vitest | 3.x *(pin at Phase 0)* | Same |
| Testing (Rust) | `cargo test` + `cargo-nextest` | *(pin at Phase 0)* | Same |
| E2E testing | Playwright + Tauri driver | *(pin at Phase 0)* | Same |

---

## D. Shared Contracts (`product/packages/contracts/`)

A pure-TypeScript package. No runtime logic — types, Zod schemas, and generated code.

| Tool | Why |
|---|---|
| TypeScript 5.9+ *(pin at Phase 0)* | Strict mode, type-only |
| Zod 4.x *(pin at Phase 0)* | Runtime validation that matches the types |
| TypeDoc | API documentation |
| Changesets | Versioning per package |

**Exports**
- Branded IDs: `ProjectId`, `AccountId`, `UserId`, `DeviceId`, `CommandId`, `EventId`, `ModuleId`, `PatchId`
- **Event envelope**: `sequence`, `resource_type`, `resource_id`, `module_id`, `actor_id`, `project_id`, `event_version`, `payload`, `idempotency_key`, optional `supersedes_event_id`
- **Frame types**: `SyncHello`, `SyncAck`, `EventBatch` (with `range_start` / `range_end`), `SnapshotPayload` (chunked), `CommandRequest`, `CommandResponse`, `Purge`, `SessionKeepalive`, `Error`
- **Error contracts**: `ValidationError`, `AuthorizationError`, `ConflictError`, `ModuleVersionMismatch`, `AdminOffline`, `NetworkError`
- **Permission strings**: `module.resource.action`, action wildcards only
- **Plan record** types (limits + entitlements, ADR-021)
- **Patch op** schemas (typed operations, ADR-015)
- **Bundle manifest** + signature + certificate-chain types (ADR-007, ADR-011)
- **Certificate** types: membership, Admin authority (ADR-010, ADR-012)
- Versioning primitives: `ProjectSequence`, `AggregateVersion`, `PermissionVersion`, `ApiVersion`, `ProjectionFormatVersion`
- Cloud API request/response types for every endpoint in `00-OVERVIEW §2.3`

The Cloud imports from this package. The Admin and User import from this package. The Cloud imports from **nowhere else** in `product/`.

---

## E. Internal Infrastructure (`internal-infra/`)

| Tool | Version | Why |
|---|---|---|
| Prometheus | *(pin at Phase 0)* | Metrics |
| Grafana | *(pin at Phase 0)* | Dashboards |
| Loki | *(pin at Phase 0)* | Logs |
| Tempo | *(pin at Phase 0)* | Traces |
| OpenTelemetry Collector | *(pin at Phase 0)* | Unified ingest |
| Infisical | *(pin at Phase 0)* | Secrets management |
| **HSM / cloud KMS** | — | Root, signing-service, licence and escrow keys. Patch key offline. |
| Woodpecker CI | 2.x | Self-hosted CI, Gitea-native |
| Gitea | *(pin at Phase 0)* | Self-hosted Git |
| MinIO | *(pin at Phase 0)* | Backup storage + retention lifecycle |
| **coturn (STUN)** | *(pin at Phase 0)* | Our own reachability servers (ADR-019) |
| **Probe service** | ours | External inbound-reachability probe — replaces the broken self-connect test |
| **Blind relay hosts** | ours | Opt-in ciphertext forwarding, metered, 24 h session metadata (ADR-024) |
| **Ops VPN** | our WireGuard | Staff access to `/ops/*` only. Not in the customer data path (ADR-013). |
| Docker Compose | 24+ | Local dev + small deployments |
| Caddy | 2.x | Reverse proxy, automatic HTTPS. Public listener never routes `/ops/*`. |

**Why self-hosted everything:** minimum cost, full data control, no vendor lock-in, predictable pricing. We pay for compute, not for the privilege of running our own software.

**Why not Kubernetes yet:** for 2–3 ops people running one Cloud instance, Compose is faster, simpler and easier to debug. Migrate when the team passes ~3 ops people or we need multi-region.

---

## F. Languages we use

| Where | Language | Why |
|---|---|---|
| Cloud API | TypeScript | Type safety, Node ecosystem, shared contracts |
| Cloud infra (migrations, scripts) | TypeScript | Same |
| Admin frontend | TypeScript + React | Team knows it |
| Admin backend | Rust | Security-critical, fast, Tauri requires it |
| User frontend | TypeScript + React | Same |
| User backend | Rust | Same |
| Modules (logic) | Rust → WASM | Performance, safety, one language across the stack |
| Modules (UI) | Static JS + CSS | Sandboxed, hashed, no build-time coupling to the app (ADR-011) |
| Scripts (CI, ops) | TypeScript or Bash | Standard |

**Deliberately not used:** Go (splits the team), Python (not needed in v1), Java/Kotlin (operational cost), C#/.NET (no benefit alongside Tauri).

---

## G. Versioning strategy

| What | How | Cadence |
|---|---|---|
| `platform-cloud` API | Semver, `/v1/…`, never break v1 | Continuous |
| Admin app | Semver, `tauri-plugin-updater` | **Every 2 weeks** |
| User app | Same, shipped together | **Every 2 weeks** |
| Modules | Independent semver, licence-bound to project + device | Per release |
| **Host API (`api_version`)** | Major must match; negotiated in `SyncHello` | Per breaking change |
| **Bundle format** | Versioned manifest schema | Rare, ADR |
| **Projection format** | `projection_format_version` in every snapshot | Rare, ADR |
| **Patch op schema** | Versioned typed ops | Per new op |
| Contracts package | Changesets, semver | Continuous |
| Database schema (Cloud) | Forward-only migrations with compensations | Per change |
| Database schema (Admin/User) | **Forward-only. No `down` in production.** Recovery = restore the pre-migration snapshot. | Per change |

**API compatibility rule:** v1 is stable. New features go to v2. Deprecations are announced six months before removal. No silent breaking changes.

**Module skew rule:** an Admin/User version mismatch is a **named, visible state** with a defined recovery (explicit `module_incompatible` skips, then a partial backfill snapshot after update) — never silent divergence (ADR-011, ADR-012).

---

## H. Cost estimate (honest, self-hosted)

Assumes 1,000 active projects, ~10 devices per project ≈ 10,000 registered devices.

| Item | Monthly cost | Notes |
|---|---|---|
| Cloud VM (4 vCPU, 16 GB) | $80 | API + Postgres + MinIO on one host to start |
| PostgreSQL | $0–$100 | Self-hosted on the same VM, or managed |
| Backup storage (1 TB) | $10–$30 | Self-hosted disk is cheaper; rented object storage varies by provider |
| Domain + DNS | $2 | |
| Monitoring VM | $20 | Prometheus/Grafana/Loki/Tempo |
| CI runner | $20 | Self-hosted |
| **Email delivery** | $15–$50 | Invitations, **recovery alerts**, dunning, receipts |
| **Key custody** | **$20–$100** (cloud KMS) **or $1,000–$2,000+** (dedicated HSM cluster) | Software-backed KMS is the v1 default; a dedicated HSM is a compliance-driven upgrade, and it is a real line item, not a rounding error |
| **Blind-relay bandwidth** | $20–$100 | Only opt-in projects; egress price varies by provider |
| STUN / probe servers | $10 | Small, shared |
| Code-signing certificates | $30–$80 | Apple + Windows (EV) amortized monthly |
| **Infra subtotal** | **~$230–$600 / month** | with cloud KMS |
| Payment processing | ~2.9% + $0.30 per transaction | Revenue-dependent, varies by country — **not infra** |
| Support staff | Human cost | **The real scaling expense.** |

At 10,000 projects, expect roughly **$1,000–$2,000/month** infra; storage, relay egress and support dominate. At 1,000,000 projects we would need a real K8s cluster and a CDN; per-project infra cost stays low, but support is a business, not a rounding error.

This is cheaper than per-seat SaaS at this scale. It is **not** "$150 all-in" — that figure omitted email, key custody, relay bandwidth, payment fees and support, and we do not repeat it.

---

## I. Phase 0 pin checklist

Before the first implementation session, verify each of these against its official release page and record the exact version in the lockfiles:

- [ ] Node.js LTS, TypeScript, Hono, Zod, Drizzle + Drizzle Kit, PostgreSQL major
- [ ] Vite, Vitest, Biome, Tailwind, TanStack Router/Query, Zustand, Radix
- [ ] Rust toolchain, `rusqlite` (+ `bundled-sqlcipher`), SQLCipher, `rusqlite_migration`, `specta`
- [ ] **Wasmtime** (and confirm the WASI Preview 2 / Component Model support level we target)
- [ ] **Userspace WireGuard crate** — confirm maintenance status; pick between `boringtun` and an actively maintained alternative
- [ ] `smoltcp`, pure-Rust mDNS crate, STUN client
- [ ] `ring` / `aws-lc-rs`, `argon2`, `keyring`, `serde_jcs`, TS `canonicalize`
- [ ] PDF crate (`typst` or `printpdf`)
- [ ] MinIO, Infisical, Gitea, Woodpecker, Prometheus/Grafana/Loki/Tempo, coturn, Caddy
- [ ] KMS/HSM choice + pricing; code-signing certificates procured
- [ ] Email provider + Stripe account + webhook signing secrets

Any row still marked *(pin at Phase 0)* after Phase 0 is a build-blocking gap, not a documentation nicety.

---

## J. What we deliberately do not use

| Not used | Why |
|---|---|
| **Drizzle in Rust** | It does not exist. Drizzle is TypeScript-only. |
| **SQLite SEE** | Commercial licence; SQLCipher is open source and sufficient. |
| **Kernel WireGuard / TUN adapter** | Needs a driver and admin rights on Windows; conflicts with real LAN ranges (ADR-024). |
| **Avahi / Bonjour as a dependency** | Not available on Windows. Pure-Rust mDNS instead. |
| **Third-party STUN by default** | Contradicts "no third party"; ours is the default, theirs is opt-in (ADR-019). |
| **Tailscale / Headscale / ZeroTier / Nebula** | Third party in the path (ADR-003 superseded by ADR-017). |
| **Electron** | Binary size, memory, and `nodeIntegration` footguns. |
| **Next.js** | No server runtime in a Tauri app. |
| **Kubernetes in v1** | Operational cost for a 2–3 person ops team. |
| **NATS / distributed queue in v1** | The SQLite outbox is sufficient and simpler. |
| **Keycloak / Auth0 / Clerk / WorkOS** | Device identity fits poorly; per-MAU cost; lock-in (ADR-010). |
| **Unverified benchmark claims** | "3× faster than X" without our own measurement is marketing, not architecture. |