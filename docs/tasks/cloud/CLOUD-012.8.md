# TASK ID: CLOUD-012.8
# TITLE: Commit all routes
# STATUS: pending
# DEPENDENCIES: CLOUD-012.7
# ALLOWED FILES: platform-cloud/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit all route handlers.

## REQUIRED IMPLEMENTATION

```bash
cd platform-cloud
git add apps/api/src/routes apps/api/src/index.ts
git commit -m "feat(cloud-api): add all v1 routes (auth, devices, projects, memberships, modules, backups) (CLOUD-012)"
```

## TESTS

```bash
cd platform-cloud
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "CLOUD-012" || { echo "FAIL"; exit 1; }
for f in auth.ts devices.ts projects.ts memberships.ts modules.ts backups.ts; do
  git show HEAD --name-only --pretty= | grep -q "routes/$f" || { echo "FAIL: $f"; exit 1; }
done
echo "OK"
```
