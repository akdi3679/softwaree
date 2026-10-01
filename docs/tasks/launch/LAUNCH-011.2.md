# TASK ID: LAUNCH-011.2
# TITLE: Commit verify
# STATUS: pending
# DEPENDENCIES: LAUNCH-011.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add modules/verify
git commit -m "feat(modules): add verification harness (LAUNCH-011)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "LAUNCH-011" || { echo "FAIL"; exit 1; }
echo "OK"
```
