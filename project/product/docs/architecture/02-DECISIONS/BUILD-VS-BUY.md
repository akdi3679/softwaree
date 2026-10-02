# Build vs Buy decisions

For each non-trivial technology, we explicitly considered alternatives.

## Authentication: Roll-our-own

Picked: Roll-our-own in TypeScript, about 3,000 lines, on Cloud Postgres.

Rejected:
- Keycloak: Java, 200MB runtime. Overkill.
- Auth0: SaaS, expensive at scale, data to third party.
- Clerk: Newer, no mature self-hosted option.
- Supabase Auth: Couples us to Supabase stack.
- AWS Cognito: AWS lock-in.

Why roll-our-own: 3,000 lines maintainable by one engineer. Device-bound sessions are native. No OAuth or social needed. Cost: $0.

Revisit if: we add OAuth, MFA, or B2C flows.

## UI: React 19

Picked: React 19 plus TanStack Router plus TanStack Query.

Rejected:
- Vue 3: Smaller ecosystem for equivalent tooling.
- Svelte: Smaller dev pool; hiring risk.
- Solid: Small ecosystem.
- Next.js: SSR and RSC we do not need; Tauri serves static.

Why React: Largest dev pool, best TanStack tooling, shared components between Admin and User.

## Backend: Hono

Picked: Hono on Node 22.

Rejected:
- Nest.js: Heavy DI framework for a 3,000-line backend.
- Fastify: Solid, but Hono has better TS ergonomics.
- Express: Legacy patterns.
- Bun plus Elysia: Not standardized on Node 22.

Why Hono: 12KB, web-standards, easy reasoning.

## Database: PostgreSQL 16 (Cloud) plus SQLite (Admin/User)

Rejected:
- MySQL: Weaker JSON.
- SQLite server: Single writer only.
- Mongo: We want SQL and ACID.
- CockroachDB: Distributed SQL; overkill.

Why PG: Battle-tested, excellent Drizzle integration, JSON columns, read replicas.

## Module runtime: Wasmtime

Picked: Wasmtime 27.

Rejected:
- Wasmer: Less mature.
- V8 isolates: No WASI P2; harder to reason about.
- Native .so: Zero sandbox, unacceptable for third-party code.
- Docker: Heavy, slow cold start.

Why Wasmtime: Bytecode Alliance (Mozilla, Fastly, Intel, Microsoft), Apache-2.0, capability-based, WASI P2.

## Networking: Own mesh (WireGuard plus mDNS plus discovery)

Picked: Our own mesh. Pure local, no third-party VPN.

Rejected:
- Tailscale: Third party in data path. Not acceptable per ADR-017.
- Cloudflare Tunnel: Vendor lock-in.
- ZeroTier: Third party, smaller ecosystem.
- Nebula: More DIY, less mature.

Why our own: LAN via mDNS is zero-config. Discovery service (in our Cloud) knows public IPs but never data. Owns the metadata. No per-device fees. Fully self-hosted.

## Backup storage: MinIO

Picked: Self-hosted MinIO.

Rejected:
- AWS S3: Lock-in.
- Wasabi and B2: Vendor ties.
- GCS and Azure: Same as S3.

Why MinIO: S3-compatible, self-hosted, backup encrypted before upload.

## CI: Woodpecker (self-hosted)

Rejected:
- GitHub Actions: GH lock-in, per-minute costs at scale.
- Drone: Dormant.
- Buildkite: SaaS, $99 per user per month.
- Jenkins: Legacy.

## Migrations: Drizzle

Rejected:
- Prisma: Heavy runtime, codegen, binary engine.
- Knex: Weak TypeScript.
- Raw SQL: No type safety.

## Rough monthly cost

| VM | Size | USD per month |
|---|---|---|
| Cloud Hono | 2 vCPU, 4GB | $20 |
| Discovery (shares cloud VM) | - | $0 |
| MinIO | 2 vCPU, 8GB, 1TB | $40 |
| Woodpecker CI | 1 vCPU, 2GB | $10 |
| Monitoring | 1 vCPU, 4GB | $15 |
| Domain and certs | - | $2 |
| Total | | about $87 per month |

At 100 active projects: about $0.87 per project per month.