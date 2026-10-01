# TASK ID: ADMIN-051.2
# TITLE: Commit i18n hook
# STATUS: pending
# DEPENDENCIES: ADMIN-051.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/admin/src/i18n/useT.ts
git commit -m "feat(admin): add i18n hook (ADMIN-051)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "ADMIN-051" || { echo "FAIL"; exit 1; }
echo "OK"
```
