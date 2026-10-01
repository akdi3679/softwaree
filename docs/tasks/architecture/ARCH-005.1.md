# TASK ID: ARCH-005.1
# TITLE: Add architecture: cost breakdown
# STATUS: pending
# DEPENDENCIES: MIGRATION-002.2
# ALLOWED FILES: docs/architecture/COST.md
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Document exact cost structure.

## REQUIRED IMPLEMENTATION

Create `docs/architecture/COST.md`:

```markdown
# Cost Breakdown

## Stage 0 (1-100 users, single VM)

| Component | Cost/month |
|---|---|
| Hetzner/OVH CCX23 (4 vCPU, 16GB) | €15 |
| Backups (200GB Hetzner Storage Box) | €4 |
| Domain name (1) | €1 |
| Stripe fee (2.9% + $0.30 per transaction) | variable |
| Resend (transactional email) | $0-20 (free tier → 50K/month) |
| **Total infra** | **~€20/month** |

## Stage 1 (100-1K users)

| Component | Cost/month |
|---|---|
| Postgres primary + 1 read replica (Hetzner CCX53 × 2) | €110 |
| MinIO 3-node cluster (Storage Box × 3) | €12 |
| Load balancer (HAProxy on a CCX13) | €8 |
| Domain + CDN (Cloudflare free) | €1 |
| Monitoring (self-hosted Prometheus + Grafana on CCX13) | €8 |
| **Total infra** | **~€140/month** |

## Stage 2 (1K-10K users)

| Component | Cost/month |
|---|---|
| Multi-AZ Postgres (2 + 1 replica) | €350 |
| MinIO with erasure coding (6 nodes) | €50 |
| Application servers (autoscale, 3-10 instances) | €300-1000 |
| Redis cluster (3 nodes) | €50 |
| OpenSearch for log search | €100 |
| **Total infra** | **~€1.5K/month** |

## Stage 3 (10K-100K users)

| Component | Cost/month |
|---|---|
| Multi-region Postgres (3 regions × primary + replica) | €1,500 |
| Per-region app clusters (3 × 6 nodes) | €1,800 |
| NATS cluster (3 nodes) | €30 |
| OpenSearch cluster | €400 |
| ClickHouse warehouse (3 nodes) | €200 |
| S3-compatible storage (Backblaze B2) | €200-500 |
| **Total infra** | **~€5K/month** |

## Stage 4 (100K-1M users)

| Component | Cost/month |
|---|---|
| Multi-region Postgres (5 regions) | €5,000 |
| Per-region app clusters (5 × 30 nodes) | €10,000 |
| CDN (Cloudflare Enterprise) | $5,000 |
| Edge functions (Cloudflare Workers or self-hosted) | €500 |
| S3 storage | €2,000 |
| **Total infra** | **~€20-30K/month** |

## Revenue targets (rule of thumb: 10x infra cost = healthy margin)

- Stage 0 → $200/month revenue = 5 customers on Team plan
- Stage 1 → $1,400/month = 30 customers
- Stage 2 → $15,000/month = 250 customers
- Stage 3 → $50,000/month = 800 customers
- Stage 4 → $200,000-300,000/month = 3-4K customers

## Cost optimization

1. Self-host everything (Postgres, MinIO, Redis, NATS, OpenSearch, ClickHouse).
2. Use Cloudflare free tier for CDN + DNS + DDoS.
3. Use Hetzner Storage Box for backups (cheap, reliable).
4. Stripe handles all PCI compliance (no need for us to be PCI certified).
5. Don't pay for auth-as-a-service (roll-our-own).
6. Use OpenStreetMap tiles (free) not Google Maps.
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/COST.md || { echo "FAIL"; exit 1; }
grep -q "Stage 0" docs/architecture/COST.md || { echo "FAIL"; exit 1; }
echo "OK"
```
