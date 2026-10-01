# TASK ID: ADMIN-017.2
# TITLE: Commit admin patient print
# STATUS: pending
# DEPENDENCIES: ADMIN-017.1
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
git commit -m "feat(admin): add printable patient summary (ADMIN-017)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-017" || { echo "FAIL"; exit 1; }
echo "OK"
```
