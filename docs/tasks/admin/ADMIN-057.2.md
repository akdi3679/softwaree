# TASK ID: ADMIN-057.2
# TITLE: Commit schema
# STATUS: pending
# DEPENDENCIES: ADMIN-057.1
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
git commit -m "feat(admin): add schema viewer (ADMIN-057)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-057" || { echo "FAIL"; exit 1; }
echo "OK"
```
