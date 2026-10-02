# Scaling path

How we go from 1 user to 1,000,000 without re-architecting.

## Stages

| Stage | Active users | Active projects | What changes |
|-------|--------------|-----------------|--------------|
| 0. Pre-launch | < 100 | < 30 | Single Cloud VM, single Postgres, single MinIO. Self-hosted. |
| 1. Early growth | 100 - 1,000 | 30 - 300 | Add read replica, monitoring alerts, on-call rotation. |
| 2. Scale-up | 1,000 - 10,000 | 300 - 3,000 | Multi-AZ Postgres, Cloud autoscaling, MinIO erasure coding, CDN in front. |
| 3. Scale-out | 10,000 - 100,000 | 3,000 - 30,000 | Multi-region (EU + US), Postgres sharding by project_id, Redis cache, NATS for cross-region events. |
| 4. Hyperscale | 100,000 - 1,000,000 | 30,000 - 300,000 | Database per region, edge functions, dedicated observability stack, separate billing service. |

## What does NOT change

Through every stage, these remain true:
- **One project = one Admin device.** No co-admins, ever.
- **One project = one Admin SQLite.** Even at hyperscale, a project lives in one Admin database. We do NOT shard the Admin data; we shard the CLOUD metadata.
- **User is always a projection.** Reads from the Admin via direct sync, never from Cloud.
- **Modules are triple-signed.** Always verified on the Admin.
- **Our mesh is the primary network.** No third-party VPN. Public HTTPS is only for the Cloud API.
- **Auth is roll-our-own.** No migration to Keycloak.

## What scales, and how

### Cloud Postgres

- **Stage 0-1**: Single instance, 2 vCPU, 4GB.
- **Stage 2**: Add a read replica for queries; writes go to primary.
- **Stage 3**: Logical sharding by project_id (one shard per N projects). Cross-shard queries are explicit.
- **Stage 4**: Per-region primary; each region owns its projects; cross-region is async via event log.

Sharding key is project_id (UUID). All project data goes to the same shard. Cross-shard queries are denormalized into a metadata table replicated everywhere.

### MinIO (backups)

- **Stage 0-1**: Single instance, 1 disk.
- **Stage 2**: Erasure coding (4+2) for redundancy.
- **Stage 3**: Replicate to a second MinIO in a different region.
- **Stage 4**: Multi-region with cross-region replication.

### Cloud API

- **Stage 0-1**: Single instance.
- **Stage 2**: Horizontal scaling, 2-4 stateless instances behind a load balancer.
- **Stage 3**: Multi-region, one cluster per region. Load balancer routes by user geolocation.
- **Stage 4**: Per-region active-active. Conflict resolution via project_id routing.

### Admin SQLite (per project)

- **All stages**: One SQLite per project. Stays the same.
- The Admin device hardware does not change; we do not ask customers to run bigger machines.
- If a project grows to > 1M events, the Admin can compact: snapshot the projection, archive the raw events, retain only the delta.

### User app

- **All stages**: Same app, same shape. The User connects to its Admin.
- We do not change the User app for scaling; we change the Cloud.

### Our mesh

- **Stage 0-2**: LAN via mDNS is the primary path. Discovery service handles cross-network.
- **Stage 3**: Discovery service replicated per region; each device picks the closest.
- **Stage 4**: Multiple discovery instances in different regions, active-active.

## What we do NOT do

We will NOT:
- Move to microservices. The Cloud is one service. It scales horizontally but stays one binary.
- Move off Hono. We chose it for a reason.
- Move off Postgres. PG scales further than people think.
- Add a queue in front of the API. The Cloud handles requests synchronously; Postgres provides durability. If we ever need async, we add NATS — but not before Stage 3.
- Add Redis before Stage 3. Most caching is a footgun. We use SQLite-level cache on the User side instead.

## When to add cache (Redis)

At Stage 3 IF:
- Cloud CPU p99 is > 200ms for 95% of requests
- Postgres connection pool is saturated
- A hot endpoint is queried > 1000x per second

Until then, Postgres handles it. PG is faster than people think for our workloads.

## When to add queue (NATS)

At Stage 3 IF:
- We need cross-region event delivery (which we do not in v1)
- We have > 10K events/sec being written

Until then, the event log is the queue. The Admin outbox + the User sync is the only queue we have.

## When to add a separate billing service

At Stage 3, when billing has its own UX and complex state. Before then, Stripe webhooks + the Cloud audit table is enough.

## When to do a full architecture review

At every stage boundary. The team must:
1. Profile the hot path
2. Verify performance budgets are met
3. Identify the new bottleneck
4. Make the change described above
5. Re-test

## What if a project grows too big for one Admin?

A project with > 1M events:
1. Run snapshot compaction (snapshot the projection, archive raw events)
2. If still too big, ask the customer to upgrade the Admin machine
3. Last resort: split the project. This is the ONLY case where a project becomes multiple. We document it as the shard workflow in v2.

## Concrete numbers

For 1M users across 300K projects:

- Postgres: 300K rows per main table. With 16 vCPU, 32GB, can serve 50K QPS.
- MinIO: 300K backups * 100MB avg = 30TB. Erasure coding 4+2 raises raw to 50TB.
- Cloud: 50 stateless instances behind a load balancer. Each handles 1K QPS.
- Our mesh: ~300K nodes. Discovery service handles 100K+ entries per instance; we run 4.
- Admin devices: 300K laptops. Each has its own SQLite. No coordination.
- User devices: 1M. Each syncs from its Admin.

Total infra cost at Stage 4: ~$10K-20K/month. Revenue at $10/user/month: $10M/month. Healthy margin.

## What if we get to 10M users?

Architecture scales linearly. We add a 4th region, more Cloud instances, another sharding tier.

## What if a single project gets 10K users?

In our model: not possible. A project is one Admin + max 10 (Team) or unlimited (Enterprise) Users, but the Admin is one laptop. If the workload demands more, the customer buys Enterprise and we run a dedicated Cloud for them. This is a sales problem, not an architecture problem.

If we relax the one-Admin-per-project rule (v2): that is a multi-Admin model. We do this only with a CRDT or a Raft consensus layer. We do NOT do it lightly.