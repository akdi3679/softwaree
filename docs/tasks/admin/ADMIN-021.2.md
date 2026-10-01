# TASK ID: ADMIN-021.2
# TITLE: Commit video
# STATUS: pending
# DEPENDENCIES: ADMIN-021.1
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
git commit -m "feat(admin): add video call component (ADMIN-021)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-021" || { echo "FAIL"; exit 1; }
echo "OK"
```
