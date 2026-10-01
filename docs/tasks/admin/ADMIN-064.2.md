# TASK ID: ADMIN-064.2
# TITLE: Commit link
# STATUS: pending
# DEPENDENCIES: ADMIN-064.1
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
git commit -m "feat(admin): add event-to-entity link (ADMIN-064)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-064" || { echo "FAIL"; exit 1; }
echo "OK"
```
