# TASK ID: ADMIN-082.2
# TITLE: Commit history
# STATUS: pending
# DEPENDENCIES: ADMIN-082.1
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
git commit -m "feat(admin): add aggregate history (ADMIN-082)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-082" || { echo "FAIL"; exit 1; }
echo "OK"
```
