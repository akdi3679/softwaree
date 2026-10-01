# TASK ID: ADMIN-081.2
# TITLE: Commit keys
# STATUS: pending
# DEPENDENCIES: ADMIN-081.1
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
git commit -m "feat(admin): add API key management (ADMIN-081)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-081" || { echo "FAIL"; exit 1; }
echo "OK"
```
