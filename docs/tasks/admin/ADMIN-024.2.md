# TASK ID: ADMIN-024.2
# TITLE: Commit jobs
# STATUS: pending
# DEPENDENCIES: ADMIN-024.1
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
git commit -m "feat(admin): add jobs view (ADMIN-024)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-024" || { echo "FAIL"; exit 1; }
echo "OK"
```
