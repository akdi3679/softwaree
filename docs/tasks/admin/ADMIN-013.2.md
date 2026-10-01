# TASK ID: ADMIN-013.2
# TITLE: Commit admin e2e tests
# STATUS: pending
# DEPENDENCIES: ADMIN-013.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit admin e2e tests.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/admin/src-tauri/tests
git commit -m "test(admin): add e2e tests for invite/create/event/audit chain (ADMIN-013)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-013" || { echo "FAIL"; exit 1; }
echo "OK"
```
