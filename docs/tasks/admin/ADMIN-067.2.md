# TASK ID: ADMIN-067.2
# TITLE: Commit legal
# STATUS: pending
# DEPENDENCIES: ADMIN-067.1
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
git commit -m "feat(admin): add legal pages (ADMIN-067)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-067" || { echo "FAIL"; exit 1; }
echo "OK"
```
