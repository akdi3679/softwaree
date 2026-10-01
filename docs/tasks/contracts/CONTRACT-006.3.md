# TASK ID: CONTRACT-006.3
# TITLE: Commit Result types
# STATUS: pending
# DEPENDENCIES: CONTRACT-006.2
# ALLOWED FILES: product/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit Result type and its tests.

## REQUIRED IMPLEMENTATION

```bash
cd product
git add packages/contracts/src/results
git commit -m "feat(contracts): add Result<T,E> discriminated union with tests (CONTRACT-006)"
```

## ACCEPTANCE CRITERIA
- [ ] One new commit
- [ ] result.ts and result.test.ts in commit

## TESTS

```bash
cd product
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "CONTRACT-006" || { echo "FAIL"; exit 1; }
git show HEAD --name-only --pretty= | grep -q "results/result.ts" || { echo "FAIL: result.ts"; exit 1; }
git show HEAD --name-only --pretty= | grep -q "results/result.test.ts" || { echo "FAIL: test"; exit 1; }
echo "OK"
```
