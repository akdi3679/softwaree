# TASK ID: ADMIN-022.2
# TITLE: Commit roles
# STATUS: pending
# DEPENDENCIES: ADMIN-022.1
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
git commit -m "feat(admin): add role-permission matrix UI (ADMIN-022)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-022" || { echo "FAIL"; exit 1; }
echo "OK"
```
