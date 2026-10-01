# TASK ID: ADMIN-004.5
# TITLE: Commit SQLite per-project foundation
# STATUS: pending
# DEPENDENCIES: ADMIN-004.4
# ALLOWED FILES: product/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit SQLite per-project foundation.

## REQUIRED IMPLEMENTATION

```bash
cd product
git add apps/admin
git commit -m "feat(admin): add SQLite per-project with migrations, pool, open/create commands (ADMIN-004)"
```

## TESTS

```bash
cd product
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "ADMIN-004" || { echo "FAIL"; exit 1; }
echo "OK"
```
