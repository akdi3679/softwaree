# TASK ID: LAUNCH-009.2
# TITLE: Commit first setup
# STATUS: pending
# DEPENDENCIES: LAUNCH-009.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/admin
git commit -m "feat(admin): add first-time setup wizard (LAUNCH-009)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "LAUNCH-009" || { echo "FAIL"; exit 1; }
echo "OK"
```
