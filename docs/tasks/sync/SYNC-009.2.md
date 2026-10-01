# TASK ID: SYNC-009.2
# TITLE: Commit idle
# STATUS: pending
# DEPENDENCIES: SYNC-009.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/user
git commit -m "feat(sync): add idle disconnect (SYNC-009)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "SYNC-009" || { echo "FAIL"; exit 1; }
echo "OK"
```
