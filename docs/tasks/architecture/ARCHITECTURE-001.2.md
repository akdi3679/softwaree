# TASK ID: ARCHITECTURE-001.2
# TITLE: Add build-vs-buy decisions (key technologies)
# STATUS: pending
# DEPENDENCIES: ARCHITECTURE-001.1
# ALLOWED FILES: /workspace/docs/architecture/02-DECISIONS/BUILD-VS-BUY.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Document the build-vs-buy decisions for each key technology choice. Includes the alternatives we considered and why we picked what we did.

## REQUIRED IMPLEMENTATION

Create `/workspace/docs/architecture/02-DECISIONS/BUILD-VS-BUY.md`:

```markdown
# Build vs Buy decisions

For each non-trivial technology, we explicitly considered the alternatives. This document records what we picked, what we rejected, and why.

## Authentication: Roll-our-own (vs Keycloak / Auth0 / Clerk / Supabase Auth)

**Picked**: Roll-our-own in TypeScript, ~3K lines, on the Cloud's Postgres.

**Considered**:
- **Keycloak**: Java, heavy (~200MB), complex to operate. Overkill for our needs.
- **Auth0**: SaaS, expensive at scale ($0.07/MAU), data goes to third party.
- **Clerk**: Same as Auth0 but newer, no self-hosted option until very late.
- **Supabase Auth**: Couples us to Supabase, the rest of which we don't use.
- **AWS Cognito**: Lock-in, AWS-only.

**Why we picked roll-our-own**:
- 3K lines of TypeScript is maintainable by one engineer.
- We need: email+password, device-bound sessions, our-mesh-aware. None of the above support device-bound sessions natively.
- We don't need: OAuth (no social login), MFA (our mesh IS the second factor), passwordless.
- The Cloud is the only place we need auth; it's small.
- Total monthly cost: $0 vs ~$100+ for SaaS auth.

**When to revisit**: If we add OAuth, MFA, or B2C login flows.

## UI framework: React 19 (vs Vue / Svelte / Solid)

**Picked**: React 19 with TanStack Router + TanStack Query.

**Considered**:
- **Vue 3**: Smaller ecosystem for our needs (TanStack equivalents are less mature).
- **Svelte / SvelteKit**: We like it, but the dev pool is smaller. Hiring risk.
- **Solid**: Performance, but ecosystem is small.
- **Next.js**: Server-rendered SPA hybrid. We don't need SSR; everything is local.

**Why React**:
- Largest dev pool = easier hiring.
- TanStack Router + Query is the best-in-class for our use case.
- We use the same React for Admin AND User, sharing components.

**When to revisit**: If we want to do server-side rendering for marketing pages (we don't, today).

## Backend framework: Hono (vs Nest.js / Fastify / Express)

**Picked**: Hono on Node 22.

**Considered**:
- **Nest.js**: Heavy, opinionated, DI-driven. Overkill for a 3K-LOC backend.
- **Fastify**: Solid, but Hono has better TypeScript ergonomics.
- **Express**: Legacy; we'd be writing patches around it.
- **Bun + Elysia**: Newer, but we standardize on Node 22 for compatibility.

**Why Hono**:
- 12KB runtime, no DI, web-standards based.
- Easy to reason about.
- Edge-deployable if we ever want to.

**When to revisit**: If we need streaming responses, large file uploads, or if Hono's ecosystem stalls.

## Database: PostgreSQL (vs MySQL / SQLite / Mongo)

**Picked**: PostgreSQL 16 for Cloud; SQLite for Admin/User.

**Considered**:
- **MySQL**: SQL is similar but PG has better JSON and generated columns.
- **SQLite (server)**: Single-writer. Doesn't scale past one Admin per Cloud.
- **Mongo**: We want ACID; we want SQL. Mongo is wrong.
- **CockroachDB / Spanner**: Distributed SQL. Not needed; we have one Cloud instance.

**Why PG**:
- Battle-tested.
- Drizzle is excellent for it.
- JSON columns handle our flexible schemas.
- We can run a read replica for analytics if needed.

**When to revisit**: If we go multi-region, where PG's read-replica lag becomes a problem.

## Module runtime: Wasmtime (vs Wasmer / V8 isolates / Native)

**Picked**: Wasmtime 27.

**Considered**:
- **Wasmer**: Less mature, smaller ecosystem.
- **V8 isolates**: Faster, but no WASI Preview 2 support, harder to reason about.
- **Native (.so)**: Fastest, but ZERO sandboxing. Not acceptable for third-party code.
- **Docker**: Heavy, slow to start, requires running a container runtime.

**Why Wasmtime**:
- Bytecode Alliance backing; Apache-2.0.
- WASI Preview 2 support = portable modules.
- Capability-based = strong sandbox.
- We can compile modules from any language that targets wasm32-wasip2.

**When to revisit**: Never, unless WASI dies (unlikely).

## Networking: our WireGuard mesh (our own implementation) / Cloudflare Tunnel / WireGuard+wgcloud)

**Picked**: our WireGuard mesh (we implement the protocol ourselves).

**Considered**:
- **WireGuard direct**: Manual key management, no NAT traversal, no admin UI.
- **Cloudflare Tunnel**: Couples us to Cloudflare; we want to be vendor-independent.
- **ZeroTier**: Similar to our mesh but smaller ecosystem and less mature.
- **Nebula (overlay)**: Self-hosted, but more DIY.

**Why our WireGuard mesh (our own implementation)**:
- Our implementation is best for our privacy + no-third-party requirement.
- Our discovery service runs in our Cloud; we own the IP metadata.
- DERP relay = NAT traversal for free.
- Easy to set up: zero config on LAN, optional customer relay for cross-network.

**When to revisit**: If we ever decide to outsource the mesh (we will not, per user goal).

## Backup storage: MinIO (vs S3 / Wasabi / B2)

**Picked**: Self-hosted MinIO.

**Considered**:
- **AWS S3**: Best in class, but locks us in.
- **Wasabi**: Cheaper S3 alternative; vendor.
- **Backblaze B2**: Cheap, vendor.
- **GCS / Azure Blob**: Same as S3, different vendor.

**Why MinIO**:
- S3-compatible API.
- We own the data.
- We encrypt before upload, so even if MinIO is compromised, the data is opaque.
- We can replicate to a second MinIO for DR.

**When to revisit**: If we add users in geographies where running our own storage is impractical (we don't have any today).

## CI: Woodpecker (vs GitHub Actions / Drone / Buildkite)

**Picked**: Woodpecker CI, self-hosted.

**Considered**:
- **GitHub Actions**: Easy, but ties us to GitHub, costs add up.
- **Drone**: Older; not actively developed.
- **Buildkite**: SaaS, $99/user/month.
- **Jenkins**: Legacy, painful.

**Why Woodpecker**:
- Self-hosted, runs on our VM.
- YAML config (like GH Actions).
- Free, OSS.
- Pluggable backends.

**When to revisit**: If we add many more engineers and need hosted CI for elastic capacity.

## Database migrations: Drizzle (vs Prisma / Knex / raw SQL)

**Picked**: Drizzle.

**Considered**:
- **Prisma**: Heavy runtime, query engine binary, slow.
- **Knex**: Old, weak TypeScript.
- **Raw SQL**: Maximum control, but we want type safety.

**Why Drizzle**:
- Pure TypeScript, no runtime.
- Type-safe queries.
- Schema as TS = single source of truth.
- Migration tooling built-in.

**When to revisit**: Never, unless Drizzle is unmaintained.

## Total monthly cost (rough)

- 1 VM for Cloud (2 vCPU, 4GB) — $20/mo
- 0 additional VMs for our mesh (runs in the same Cloud VM)
- 1 VM for MinIO (2 vCPU, 8GB, 1TB) — $40/mo
- 1 VM for CI/CD (Woodpecker) — $10/mo
- 1 VM for monitoring (Prometheus + Grafana) — $15/mo
- Domain + certs — $2/mo
- **Total: ~$100/mo for 100 active projects** (we have 0 active projects today)

Cost per project: ~$1/month. SaaS alternatives (Notion, Slack, etc.) would be 10-100x more.
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/02-DECISIONS/BUILD-VS-BUY.md || { echo "FAIL"; exit 1; }
grep -q "Build vs Buy" docs/architecture/02-DECISIONS/BUILD-VS-BUY.md || { echo "FAIL"; exit 1; }
grep -q "Wasmtime" docs/architecture/02-DECISIONS/BUILD-VS-BUY.md || { echo "FAIL: no Wasmtime"; exit 1; }
echo "OK"
```
