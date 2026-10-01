# TASK ID: ADMIN-086.2
# TITLE: Commit meta
# STATUS: pending
# DEPENDENCIES: ADMIN-086.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/admin/index.html
git commit -m "build(admin): add OG meta (ADMIN-086)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-086" || { echo "FAIL"; exit 1; }
echo "OK"
```
