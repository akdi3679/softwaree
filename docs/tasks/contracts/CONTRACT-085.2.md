# TASK ID: CONTRACT-085.2
# TITLE: Commit signing helper
# STATUS: pending
# DEPENDENCIES: CONTRACT-085.1
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add contracts/src/test_helpers
git commit -m "feat(contracts): add signing test helper (CONTRACT-085)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "CONTRACT-085" || { echo "FAIL"; exit 1; }
echo "OK"
```
