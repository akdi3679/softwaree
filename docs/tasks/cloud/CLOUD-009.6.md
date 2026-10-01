# TASK ID: CLOUD-009.6
# TITLE: Commit business services
# STATUS: pending
# DEPENDENCIES: CLOUD-009.5
# ALLOWED FILES: platform-cloud/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit project, invitation, membership, audit services.

## REQUIRED IMPLEMENTATION

```bash
cd platform-cloud
git add apps/api/src/services
git commit -m "feat(cloud-api): add project, invitation, membership, audit services (CLOUD-009)"
```

## TESTS

```bash
cd platform-cloud
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "CLOUD-009" || { echo "FAIL"; exit 1; }
git show HEAD --name-only --pretty= | grep -q "services/project.ts" || { echo "FAIL"; exit 1; }
git show HEAD --name-only --pretty= | grep -q "services/audit.ts" || { echo "FAIL"; exit 1; }
echo "OK"
```
