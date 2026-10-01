# TASK ID: USER-006.2
# TITLE: Commit user e2e tests
# STATUS: pending
# DEPENDENCIES: USER-006.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit user e2e.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/user/src-tauri/tests
git commit -m "test(user): add e2e tests for full sync flow (USER-006)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "USER-006" || { echo "FAIL"; exit 1; }
echo "OK"
```
