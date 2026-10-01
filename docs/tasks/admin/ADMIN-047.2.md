# TASK ID: ADMIN-047.2
# TITLE: Commit palette
# STATUS: pending
# DEPENDENCIES: ADMIN-047.1
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
git commit -m "feat(admin): add command palette (ADMIN-047)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-047" || { echo "FAIL"; exit 1; }
echo "OK"
```
