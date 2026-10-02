# Deployment

What we deploy and how.

## Topology

Project network Operations network
Admin device (laptop) Cloud VM (Hono plus Postgres)
LAN: mDNS plus WireGuard HTTPS API: 8787
WAN: discovery plus WireGuard Discovery service (in Cloud)
MinIO VM (S3 API: 9000)
User device (laptop) CI VM (Woodpecker)
LAN: mDNS plus WireGuard Monitoring VM (Prometheus plus Grafana)
WAN: discovery plus WireGuard

The Project network carries all business data. The Operations network carries auth, billing, discovery, backups, CI.

## VMs

| VM | Size | Purpose | Cost |
|---|---|---|---|
| cloud-vm | 2 vCPU, 4GB | Hono API plus discovery service | $20/mo |
| minio-vm | 2 vCPU, 8GB, 1TB | Encrypted backup blobs | $40/mo |
| ci-vm | 1 vCPU, 2GB | Woodpecker CI | $10/mo |
| monitoring-vm | 1 vCPU, 4GB | Prometheus plus Grafana | $15/mo |

## Cloud deployment

1. Provision cloud-vm with Ubuntu 22.04.
2. Install docker and docker compose.
3. Clone platform-cloud.
4. Configure apps/api/.env: DATABASE_URL, MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, SESSION_SECRET, CLOUD_ROOT_PRIVATE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_STARTER, STRIPE_PRICE_TEAM, STRIPE_PRICE_ENTERPRISE, SMTP_HOST, SMTP_USER, SMTP_PASS, FROM_ADDRESS, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_MAILTO, SLACK_SECURITY_WEBHOOK, SECURITY_EMAIL_TO.
5. Run pnpm install and drizzle-kit migrate.
6. docker compose up -d.
7. Verify curl http://localhost:8787/health returns status ok.

## Discovery service

Runs inside the Cloud API process (no separate VM in v1). Endpoints:
- POST /v1/discovery/heartbeat - device reports current public IP
- GET /v1/discovery/lookup?virtual_ip=X - device asks where peer is

Storage: device_discovery table on the Cloud Postgres. Retention: forget entries older than 7 days.

## MinIO deployment

1. Provision minio-vm.
2. Pull MinIO image.
3. Configure credentials in environment.
4. Create bucket product-backups.
5. Lifecycle policy: 30-day expiry by default; overridden per plan.
6. Test upload and download round-trip via mc CLI.

## CI (Woodpecker)

1. Provision ci-vm.
2. Run Woodpecker server and agent as containers.
3. Configure Gitea OAuth for login.
4. Connect the product and platform-cloud repos.
5. Agent auto-discovers pipelines in .woodpecker.yml.

## Monitoring

- Prometheus scrapes Cloud at cloud-vm:8787/metrics.
- Grafana dashboards under internal-infra/grafana.
- Alerts in internal-infra/prometheus/alerts.yml.

## Deployment cadence

| Component | Frequency | Gate |
|---|---|---|
| Cloud API | weekly | CI plus manual approval |
| Discovery service | same as Cloud | same |
| MinIO | monthly | version upgrades only |
| Woodpecker | as needed | - |
| Admin and User apps | per release | Tauri updater |

## Secrets

All secrets in Infisical: release/*, cloud/*, discovery/*.

## Certificates

- Public HTTPS: Let's Encrypt via Caddy, auto-renewed.
- Mesh: WireGuard keys, per-device.

## Cloud data backups

- Postgres: daily pg_dump under cloud-meta-backups in MinIO.
- MinIO: replicated to a second MinIO in a different DC.
- Discovery config: daily snapshot to Infisical.

## Recovery from full-region failure

1. Provision new VMs in a different region.
2. Restore Postgres from latest dump.
3. Restore MinIO from replicated copy.
4. Update DNS.
5. Devices reconnect via discovery.
6. Admin devices are unaffected; their data is local.

## What we do NOT deploy

- No Kubernetes. Docker Compose is enough at this stage.
- No CDN. Static assets are served from the same Cloud.
- No third-party VPN. Own mesh only (ADR-017).