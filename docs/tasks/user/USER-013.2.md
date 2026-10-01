# TASK ID: USER-013.2
# TITLE: Commit offline cache
# STATUS: pending
# DEPENDENCIES: USER-013.1
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
git commit -m "feat(user): add offline projection cache stats (USER-013)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "USER-013" || { echo "FAIL"; exit 1; }
echo "OK"
```
