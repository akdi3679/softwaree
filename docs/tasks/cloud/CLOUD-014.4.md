# TASK ID: CLOUD-014.4
# TITLE: Commit observability
# STATUS: pending
# DEPENDENCIES: CLOUD-014.3
# ALLOWED FILES: platform-cloud/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit observability layer.

## REQUIRED IMPLEMENTATION

```bash
cd platform-cloud
git add apps/api/src/observability apps/api/src/routes/metrics.ts apps/api/src/middleware/metrics.ts apps/api/src/index.ts
git commit -m "feat(cloud-api): add Prometheus metrics, /metrics endpoint, HTTP metrics middleware (CLOUD-014)"
```

## TESTS

```bash
cd platform-cloud
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "CLOUD-014" || { echo "FAIL"; exit 1; }
echo "OK"
```
