# TASK ID: CONTRACT-084.3
# TITLE: Commit conformance tests
# STATUS: pending
# DEPENDENCIES: CONTRACT-084.2
# ALLOWED FILES: product/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit conformance tests.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/product
git add packages/contracts/src/__tests__ packages/contracts/package.json
git commit -m "test(contracts): add envelope + ID conformance tests (CONTRACT-084)"
```

## TESTS

```bash
cd /workspace/product
git log -1 --pretty=%s | grep -q "CONTRACT-084" || { echo "FAIL"; exit 1; }
echo "OK"
```
