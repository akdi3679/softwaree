# TASK ID: SYNC-004.3
# TITLE: Commit sync depth
# STATUS: pending
# DEPENDENCIES: SYNC-004.2
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/user
git commit -m "feat(sync): add snapshot recovery + per-table cursor (SYNC-004)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "SYNC-004" || { echo "FAIL"; exit 1; }
echo "OK"
```
