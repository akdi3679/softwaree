# TASK ID: SYNC-008.2
# TITLE: Commit compression
# STATUS: pending
# DEPENDENCIES: SYNC-008.1
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
git commit -m "feat(sync): add zstd compression (SYNC-008)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "SYNC-008" || { echo "FAIL"; exit 1; }
echo "OK"
```
