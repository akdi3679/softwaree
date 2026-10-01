# TASK ID: ADMIN-084.2
# TITLE: Commit upgrade
# STATUS: pending
# DEPENDENCIES: ADMIN-084.1
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
git commit -m "feat(admin): add upgrade flow (ADMIN-084)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-084" || { echo "FAIL"; exit 1; }
echo "OK"
```
