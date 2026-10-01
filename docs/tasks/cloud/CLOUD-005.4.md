# TASK ID: CLOUD-005.4
# TITLE: Commit identity and project schemas
# STATUS: pending
# DEPENDENCIES: CLOUD-005.3
# ALLOWED FILES: platform-cloud/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit identity and project schemas.

## REQUIRED IMPLEMENTATION

```bash
cd platform-cloud
git add apps/api/src/db/schema
git commit -m "feat(cloud-api): add identity and project schemas (accounts, users, devices, sessions, invitations, projects, memberships, roles) (CLOUD-004, CLOUD-005)"
```

## TESTS

```bash
cd platform-cloud
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "CLOUD-00" || { echo "FAIL"; exit 1; }
git show HEAD --name-only --pretty= | grep -q "db/schema/projects.ts" || { echo "FAIL"; exit 1; }
git show HEAD --name-only --pretty= | grep -q "db/schema/devices.ts" || { echo "FAIL"; exit 1; }
echo "OK"
```
