# TASK ID: ADMIN-018.2
# TITLE: Commit shortcuts
# STATUS: pending
# DEPENDENCIES: ADMIN-018.1
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
git commit -m "feat(admin): add keyboard shortcuts overlay (ADMIN-018)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-018" || { echo "FAIL"; exit 1; }
echo "OK"
```
