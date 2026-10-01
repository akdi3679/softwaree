# TASK ID: CLOUD-006.5
# TITLE: Commit remaining schemas
# STATUS: pending
# DEPENDENCIES: CLOUD-006.4
# ALLOWED FILES: platform-cloud/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit plans, modules, audit, backups schemas.

## REQUIRED IMPLEMENTATION

```bash
cd platform-cloud
git add apps/api/src/db/schema
git commit -m "feat(cloud-api): add plans, modules, audit, backups schemas (CLOUD-006)"
```

## TESTS

```bash
cd platform-cloud
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "CLOUD-006" || { echo "FAIL"; exit 1; }
for f in plans.ts modules.ts audit.ts backups.ts; do
  git show HEAD --name-only --pretty= | grep -q "db/schema/$f" || { echo "FAIL: $f"; exit 1; }
done
echo "OK"
```
