# TASK ID: CLOUD-003.6
# TITLE: Commit DB foundation
# STATUS: pending
# DEPENDENCIES: CLOUD-003.5
# ALLOWED FILES: platform-cloud/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit Drizzle setup + first schemas.

## REQUIRED IMPLEMENTATION

```bash
cd platform-cloud
git add apps/api/src/db apps/api/drizzle.config.ts apps/api/.env.example
git commit -m "feat(cloud-api): add Drizzle ORM setup with accounts and users schemas (CLOUD-003)"
```

## TESTS

```bash
cd platform-cloud
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "CLOUD-003" || { echo "FAIL"; exit 1; }
git show HEAD --name-only --pretty= | grep -q "db/schema/accounts.ts" || { echo "FAIL"; exit 1; }
echo "OK"
```
