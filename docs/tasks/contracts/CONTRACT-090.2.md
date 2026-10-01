# TASK ID: CONTRACT-090.2
# TITLE: Commit types
# STATUS: pending
# DEPENDENCIES: CONTRACT-090.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add contracts/src/types
git commit -m "feat(contracts): add typed event types (CONTRACT-090)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "CONTRACT-090" || { echo "FAIL"; exit 1; }
echo "OK"
```
