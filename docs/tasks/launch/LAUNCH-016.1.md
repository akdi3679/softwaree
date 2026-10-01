# TASK ID: LAUNCH-016.1
# TITLE: Add chaos: database failover (Cloud)
# STATUS: pending
# DEPENDENCIES: LAUNCH-015.2
# ALLOWED FILES: product/apps/admin/tests/chaos_db_failover.rs, platform-cloud/chaos/failover.sh
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Verify Cloud survives Postgres primary loss by failing over to replica.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/chaos/failover.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
# Demo: spin up Postgres + replica, then kill primary, verify Cloud still serves from replica.

docker compose -f deploy/docker-compose.chaos.yml up -d
sleep 10

echo "Checking Cloud via primary…"
curl -s http://localhost:8787/health | jq -e '.ok == true' || { echo "FAIL: primary"; exit 1; }

echo "Killing primary…"
docker kill postgres-primary
sleep 5

echo "Checking Cloud via replica…"
# Cloud's connection pool should detect failure and reconnect to replica
for i in 1 2 3 4 5; do
  if curl -s http://localhost:8787/health | jq -e '.ok == true'; then
    echo "✓ Failover OK after ${i} attempts"
    exit 0
  fi
  sleep 2
done

echo "✗ Failover FAILED"
docker compose -f deploy/docker-compose.chaos.yml down
exit 1
```

Create `product/apps/admin/tests/chaos_db_failover.rs`:

```rust
//! The cloud-side failover test (companion to platform-cloud/chaos/failover.sh).
//! This file just documents the manual steps for our own runbook.

#[test]
#[ignore]
fn doc_db_failover_test() {
    // Run via:
    //   cd platform-cloud && bash chaos/failover.sh
    // This is documented in docs/runbooks/CLOUD-DR.md.
}
```

## TESTS

```bash
cd /workspace
test -f platform-cloud/chaos/failover.sh || { echo "FAIL"; exit 1; }
chmod +x platform-cloud/chaos/failover.sh
echo "OK"
```
