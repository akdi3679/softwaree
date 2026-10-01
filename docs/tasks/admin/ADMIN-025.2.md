# TASK ID: ADMIN-025.2
# TITLE: Commit banner
# STATUS: pending
# DEPENDENCIES: ADMIN-025.1
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
git commit -m "feat(admin): add announcement banner (ADMIN-025)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-025" || { echo "FAIL"; exit 1; }
echo "OK"
```
