# TASK ID: CONTRACT-089.2
# TITLE: Commit event schemas
# STATUS: pending
# DEPENDENCIES: CONTRACT-089.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add contracts/src/schemas
git commit -m "feat(contracts): add event Zod schemas (CONTRACT-089)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "CONTRACT-089" || { echo "FAIL"; exit 1; }
echo "OK"
```
