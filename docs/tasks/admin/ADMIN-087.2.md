# TASK ID: ADMIN-087.2
# TITLE: Commit smoke
# STATUS: pending
# DEPENDENCIES: ADMIN-087.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/admin/src-tauri/tests
git commit -m "test(admin): add 1s smoke (ADMIN-087)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-087" || { echo "FAIL"; exit 1; }
echo "OK"
```
