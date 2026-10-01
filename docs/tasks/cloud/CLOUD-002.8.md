# TASK ID: CLOUD-002.8
# TITLE: Commit Hono app skeleton
# STATUS: pending
# DEPENDENCIES: CLOUD-002.7
# ALLOWED FILES: platform-cloud/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit the Hono skeleton.

## REQUIRED IMPLEMENTATION

```bash
cd platform-cloud
git add apps/api pnpm-lock.yaml
git commit -m "feat(cloud-api): add Hono skeleton with error handling, correlation ID, structured logging (CLOUD-002)"
```

## TESTS

```bash
cd platform-cloud
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "CLOUD-002" || { echo "FAIL"; exit 1; }
git show HEAD --name-only --pretty= | grep -q "apps/api/src/index.ts" || { echo "FAIL"; exit 1; }
echo "OK"
```
