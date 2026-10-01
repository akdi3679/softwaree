# TASK ID: ADMIN-091.2
# TITLE: Commit integration
# STATUS: pending
# DEPENDENCIES: ADMIN-091.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/admin/tests
git commit -m "test(admin): add full integration test (ADMIN-091)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-091" || { echo "FAIL"; exit 1; }
echo "OK"
```
