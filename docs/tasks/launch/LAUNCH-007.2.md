# TASK ID: LAUNCH-007.2
# TITLE: Commit drill
# STATUS: pending
# DEPENDENCIES: LAUNCH-007.1
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
git commit -m "feat(backup): add monthly restore drill (LAUNCH-007)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "LAUNCH-007" || { echo "FAIL"; exit 1; }
echo "OK"
```
