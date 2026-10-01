# TASK ID: ADMIN-050.2
# TITLE: Commit archive
# STATUS: pending
# DEPENDENCIES: ADMIN-050.1
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
git commit -m "feat(admin): add archive project page (ADMIN-050)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-050" || { echo "FAIL"; exit 1; }
echo "OK"
```
