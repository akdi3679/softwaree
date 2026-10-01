# TASK ID: ADMIN-083.2
# TITLE: Commit top
# STATUS: pending
# DEPENDENCIES: ADMIN-083.1
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
git commit -m "feat(admin): add top patients (ADMIN-083)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-083" || { echo "FAIL"; exit 1; }
echo "OK"
```
