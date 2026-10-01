# TASK ID: PERFORMANCE-001.1
# TITLE: Add performance budgets document
# STATUS: pending
# DEPENDENCIES: FOODLAB-001.2
# ALLOWED FILES: /workspace/docs/performance/BUDGETS.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Document performance budgets for every layer of the platform.

## REQUIRED IMPLEMENTATION

Create `/workspace/docs/performance/BUDGETS.md`:

```markdown
# Performance budgets

The platform is built on specific performance targets. Every change must respect these budgets. CI runs benchmarks and fails the build if a regression > 10% is detected.

## Admin (Tauri + React)

| Operation | Budget | Measurement |
|-----------|--------|-------------|
| Cold start (laptop) | < 2.0s | launch → dashboard rendered |
| Warm start | < 0.5s | window shown → dashboard rendered |
| Open project (10K events) | < 0.5s | click → data ready |
| Open project (1M events) | < 2.0s | click → data ready |
| Invite user | < 0.2s | click → invitation in DB |
| Backup create + encrypt (10MB) | < 1.0s | click → backup_id returned |
| Backup upload (10MB) | < 5.0s | click → HTTP 200 |
| Memory idle | < 300MB | no projects open |
| Memory loaded (5 projects) | < 600MB | 5 projects, 100K events each |

## User (Tauri + React)

| Operation | Budget | Measurement |
|-----------|--------|-------------|
| Cold start | < 1.5s | launch → connect page |
| Sync (10 events) | < 200ms | request → projection applied |
| Sync (1000 events) | < 2s | request → projection applied |
| Snapshot apply (10K rows) | < 1s | reception → UI updated |
| Memory idle | < 150MB | not connected |
| Memory loaded (1 project) | < 200MB | connected, projection ready |

## Cloud (Hono + Postgres)

| Endpoint | p50 | p95 | p99 |
|----------|-----|-----|-----|
| POST /v1/accounts | 200ms | 500ms | 1.5s |
| POST /v1/accounts/sessions | 300ms | 800ms | 2s |
| GET /v1/projects | 50ms | 200ms | 500ms |
| POST /v1/projects | 200ms | 500ms | 1s |
| GET /v1/modules | 100ms | 300ms | 1s |
| POST /v1/modules/.../package (binary) | 500ms | 1.5s | 3s |
| POST /v1/backups | 200ms | 500ms | 1s |

Cloud requests are rate-limited: 600/min/account, 300/min/device. Anything above this is throttled.

## Sync (User → Admin)

| Operation | Budget | Measurement |
|-----------|--------|-------------|
| Handshake | < 200ms | connect → Welcome received |
| Hello signature verify | < 10ms | on the Admin |
| Sync request → response (100 events) | < 100ms | request → JSON in |
| Push event → User applies | < 50ms | event emitted → projection written |
| Heartbeat round-trip | < 50ms | send → ack |

## Module (Wasmtime)

| Operation | Budget |
|-----------|--------|
| Module load + verify | < 1s |
| Module call (single command) | < 100ms |
| Module call (single query) | < 50ms |
| Memory cap | 64MB per module |
| Fuel cap | 100,000 per call |

## Network

| Link | Latency budget |
|------|---------------|
| User → Admin (our mesh direct) | < 50ms p99 |
| User → Admin (DERP relay) | < 200ms p99 |
| Admin → Cloud (our mesh) | < 100ms p99 |
| Admin → Cloud (public DNS fallback) | < 300ms p99 |

## Database

| Operation | Budget |
|-----------|--------|
| Admin SQLite read (single row by PK) | < 5ms |
| Admin SQLite read (10K events range) | < 50ms |
| Admin SQLite write (single event) | < 10ms |
| Admin SQLite write (transaction with audit) | < 30ms |
| Cloud Postgres read (single row by PK) | < 10ms |
| Cloud Postgres read (full table scan, 100K rows) | < 200ms |
| Cloud Postgres write (single row) | < 20ms |

## Storage

| Resource | Budget |
|----------|--------|
| Admin SQLite per project (steady state) | < 1GB for 1M events |
| Admin SQLite growth rate | < 50MB per 10K events |
| Cloud DB per project (metadata only) | < 1MB |
| Backup blob size (10K events) | < 5MB compressed |
| Backup blob size (1M events) | < 500MB compressed |

## CI enforcement

CI runs benchmarks on every PR. A regression > 10% in any budget fails the build. The CI machine is standardized (GitHub-hosted ubuntu-22.04, 2 vCPU, 7GB RAM).

## What is NOT measured

- Mobile (out of scope for v1)
- WAN conditions (we assume our mesh is fast)
- First-launch disk I/O (depends on the user's machine)
```

## TESTS

```bash
cd /workspace
test -f docs/performance/BUDGETS.md || { echo "FAIL"; exit 1; }
grep -q "Performance budgets" docs/performance/BUDGETS.md || { echo "FAIL"; exit 1; }
grep -q "p99" docs/performance/BUDGETS.md || { echo "FAIL: no p99"; exit 1; }
echo "OK"
```
