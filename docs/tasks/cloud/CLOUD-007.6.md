# TASK ID: CLOUD-007.6
# TITLE: Commit crypto foundation
# STATUS: pending
# DEPENDENCIES: CLOUD-007.5
# ALLOWED FILES: platform-cloud/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit crypto foundation.

## REQUIRED IMPLEMENTATION

```bash
cd platform-cloud
git add apps/api/src/crypto apps/api/package.json pnpm-lock.yaml
git commit -m "feat(cloud-api): add crypto (Argon2id, Ed25519, challenge) with tests (CLOUD-007)"
```

## TESTS

```bash
cd platform-cloud
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "CLOUD-007" || { echo "FAIL"; exit 1; }
echo "OK"
```
