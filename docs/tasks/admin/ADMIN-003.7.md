# TASK ID: ADMIN-003.7
# TITLE: Commit Rust backend foundation
# STATUS: pending
# DEPENDENCIES: ADMIN-003.6
# ALLOWED FILES: product/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit the Rust backend foundation.

## REQUIRED IMPLEMENTATION

```bash
cd product
git add apps/admin
git commit -m "feat(admin): add Rust backend foundation (tracing, crypto, identity) (ADMIN-003)"
```

## TESTS

```bash
cd product
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "ADMIN-003" || { echo "FAIL"; exit 1; }
echo "OK"
```
