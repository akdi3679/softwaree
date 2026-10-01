# TASK ID: CONTRACT-011.3
# TITLE: Commit pagination
# STATUS: pending
# DEPENDENCIES: CONTRACT-011.2
# ALLOWED FILES: product/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit pagination types.

## REQUIRED IMPLEMENTATION

```bash
cd product
git add packages/contracts/src/pagination
git commit -m "feat(contracts): add pagination types (request, page) (CONTRACT-011)"
```

## TESTS

```bash
cd product
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "CONTRACT-011" || { echo "FAIL"; exit 1; }
echo "OK"
```
