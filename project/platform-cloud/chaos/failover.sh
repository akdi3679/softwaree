#!/usr/bin/env bash
# DB failover chaos test.
# Brings up Postgres + replica, kills primary, verifies Cloud still serves.
# Requires: docker, docker-compose, jq, curl
set -euo pipefail

COMPOSE_FILE="chaos/docker-compose.chaos.yml"
CLOUD_URL="${CLOUD_URL:-http://localhost:8787}"

cleanup() {
  docker compose -f "$COMPOSE_FILE" down -v >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "[1/4] bringing up postgres + replica + cloud"
docker compose -f "$COMPOSE_FILE" up -d
sleep 15

echo "[2/4] checking Cloud health via primary"
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -sf "$CLOUD_URL/health" | jq -e '.status == "ok"' >/dev/null; then
    echo "  ok via primary (attempt $i)"
    break
  fi
  sleep 2
done

echo "[3/4] killing postgres-primary"
docker kill chaos-postgres-primary >/dev/null

echo "[4/4] checking Cloud health via replica"
ok=0
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -sf "$CLOUD_URL/health" | jq -e '.status == "ok"' >/dev/null; then
    echo "  failover ok after $i attempts"
    ok=1
    break
  fi
  sleep 3
done

if [ "$ok" -eq 0 ]; then
  echo "FAIL: Cloud did not recover after primary loss"
  exit 1
fi

echo "PASS: failover succeeded"