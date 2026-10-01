# TASK ID: ADMIN-032.2
# TITLE: Commit export
# STATUS: pending
# DEPENDENCIES: ADMIN-032.1
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
git commit -m "feat(admin): add data export UI (ADMIN-032)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-032" || { echo "FAIL"; exit 1; }
echo "OK"
```
