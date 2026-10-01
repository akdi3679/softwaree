# TASK ID: ADMIN-073.2
# TITLE: Commit help
# STATUS: pending
# DEPENDENCIES: ADMIN-073.1
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
git commit -m "feat(admin): add help search (ADMIN-073)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-073" || { echo "FAIL"; exit 1; }
echo "OK"
```
