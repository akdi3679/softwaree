# TASK ID: ARCHITECTURE-001.3
# TITLE: Add 04-DEPLOYMENT document
# STATUS: pending
# DEPENDENCIES: ARCHITECTURE-001.2
# ALLOWED FILES: /workspace/docs/architecture/04-DEPLOYMENT.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Document how to deploy the platform — Cloud, our mesh, MinIO, CI.

## REQUIRED IMPLEMENTATION

Create `/workspace/docs/architecture/04-DEPLOYMENT.md`:

```markdown
# Deployment

What we deploy and how.

## Topology

```
┌──────────────────────┐      ┌──────────────────────┐
│   Project Tailnet    │      │    Ops Tailnet       │
│ (our mesh client)   │      │  (our mesh client)  │
│                      │      │                      │
│ ┌──────────────┐     │      │ ┌──────────────┐     │
│ │ Admin device │     │      │ │   Cloud      │     │
│ │ (laptop)     │     │      │ │ (Hono)       │     │
│ └──────┬───────┘     │      │ └──────┬───────┘     │
│        │ TCP:9420    │      │        │ HTTP:8787   │
│ ┌──────▼───────┐     │      │ ┌──────▼───────┐     │
│ │ User device  │     │      │ │   MinIO      │     │
│ │ (laptop)     │     │      │ │ (S3 API)     │     │
│ └──────────────┘     │      │ └──────┬───────┘     │
│                      │      │        │             │
│                      │      │ ┌──────▼───────┐     │
│                      │      │ │   Postgres   │     │
│                      │      │ │ (Cloud DB)   │     │
│                      │      │ └──────────────┘     │
└──────────────────────┘      └──────────────────────┘
         │                              ▲
         │       our mesh relay        │
         └──────────────────────────────┘
```

## VMs we run

| VM | Size | Purpose | Cost |
|----|------|---------|------|
| cloud-vm | 2 vCPU, 4GB | Cloud Hono server | $20/mo |
| discovery-svc | 0.5 vCPU, 0.5GB | Discovery service (in our Cloud) | included |
| minio-vm | 2 vCPU, 8GB, 1TB | Backup storage | $40/mo |
| ci-vm | 1 vCPU, 2GB | Woodpecker CI | $10/mo |
| monitoring-vm | 1 vCPU, 4GB | Prometheus + Grafana | $15/mo |

All on Hetzner (or any cloud; we use Hetzner for cost).

## Cloud deployment

1. Provision cloud-vm with Ubuntu 22.04
2. Install our mesh client, join the operations network
3. Pull the Cloud Docker image
4. Set environment:
   - `DATABASE_URL=postgres://...`
   - `MINIO_ENDPOINT=minio-vm.tailnet:9000`
   - `MINIO_ACCESS_KEY=...`
   - `MINIO_SECRET_KEY=...`
   - `TAILSCALE_OAUTH_CLIENT_ID=...`
5. Run migrations: `docker exec cloud-vm.product /app/migrate`
6. Start: `docker compose up -d`
7. Verify: `curl https://cloud-vm.tailnet:8787/health` returns `{"ok": true}`

## MinIO deployment

1. Provision minio-vm
2. Install our mesh client
3. Pull MinIO image
4. Set credentials in environment
5. Create buckets: `product-backups`
6. Configure lifecycle: 30-day expiry on `product-backups/` prefix

## Discovery service deployment

1. Provision headscale-vm
2. Install our mesh client
3. Set up Postgres
4. Run the discovery service in the same Cloud
5. Set DNS records:
   - `headscale.product.local → headscale-vm.tailnet`
6. Generate API key for ops
7. Test: from another machine, `tailscale up --login-server https://headscale.product.local`

## CI deployment (Woodpecker)

1. Provision ci-vm
2. Install our mesh client
3. Run Woodpecker server + agent
4. Configure GitHub OAuth
5. Test: push a commit, verify a build runs

## Monitoring

- Prometheus scrapes:
  - Cloud at `cloud-vm.tailnet:8787/metrics`
  - Discovery at `discovery.internal:9090/metrics`
  - Admin devices via our WireGuard mesh SD (DNS service discovery)
- Grafana dashboards: `/workspace/internal-infra/grafana/`
- Alerts: see `internal-infra/prometheus/alerts.yml`

## Deployment frequency

- Cloud: weekly, gated by CI + manual approval
- Discovery service: continuous, follows Cloud deploy cadence
- MinIO: monthly, version upgrades
- Woodpecker: as needed
- Admin/User: per-release (Tauri updater)

## Secrets

- All secrets in Infisical
- `release/*` for release-time secrets
- `cloud/*` for runtime Cloud secrets
- `tailscale/*` for pre-auth keys

## Certificates

- We use Let's Encrypt for public-facing endpoints (only the Cloud's HTTPS)
- Internal mesh communication uses our WireGuard (built into the protocol)

## Backup of the Cloud's own data

- Postgres: daily pg_dump, stored in MinIO under `cloud-meta-backups/`
- MinIO: replicated to a second MinIO instance in a different Hetzner DC
- Discovery config: backed up daily to Infisical

## Recovery from a full region failure

1. Spin up new VMs in a different region
2. Restore Postgres from the most recent dump
3. Restore MinIO data from the replicated copy
4. Update DNS to point to new discovery service
5. Mesh clients auto-reconnect to the new discovery service
6. Admin devices reconnect via the new Cloud (their data is local, unaffected)
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/04-DEPLOYMENT.md || { echo "FAIL"; exit 1; }
grep -q "Deployment" docs/architecture/04-DEPLOYMENT.md || { echo "FAIL"; exit 1; }
grep -q "discovery" docs/architecture/04-DEPLOYMENT.md || { echo "FAIL: no discovery"; exit 1; }
echo "OK"
```
