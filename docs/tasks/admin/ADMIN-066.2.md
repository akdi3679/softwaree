# TASK ID: ADMIN-066.2
# TITLE: Commit release
# STATUS: pending
# DEPENDENCIES: ADMIN-066.1
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
git commit -m "feat(admin): add release notes viewer (ADMIN-066)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-066" || { echo "FAIL"; exit 1; }
echo "OK"
```
