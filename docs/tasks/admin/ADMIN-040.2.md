# TASK ID: ADMIN-040.2
# TITLE: Commit e2e
# STATUS: pending
# DEPENDENCIES: ADMIN-040.1
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
git commit -m "test(admin): add e2e happy path (ADMIN-040)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-040" || { echo "FAIL"; exit 1; }
echo "OK"
```
