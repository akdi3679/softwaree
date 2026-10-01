# TASK ID: SYNC-002.4
# TITLE: Commit sync depth
# STATUS: pending
# DEPENDENCIES: SYNC-002.3
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit sync depth.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add apps/admin apps/user
git commit -m "feat(sync): add reconnect throttle, partial batch, backpressure (SYNC-002)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "SYNC-002" || { echo "FAIL"; exit 1; }
echo "OK"
```
