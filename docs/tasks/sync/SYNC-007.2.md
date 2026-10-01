# TASK ID: SYNC-007.2
# TITLE: Commit protocol version
# STATUS: pending
# DEPENDENCIES: SYNC-007.1
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
git commit -m "feat(sync): add protocol version negotiation (SYNC-007)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "SYNC-007" || { echo "FAIL"; exit 1; }
echo "OK"
```
