# TASK ID: ADMIN-034.2
# TITLE: Commit quality UI
# STATUS: pending
# DEPENDENCIES: ADMIN-034.1
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
git commit -m "feat(admin): add data quality UI (ADMIN-034)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-034" || { echo "FAIL"; exit 1; }
echo "OK"
```
