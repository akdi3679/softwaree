# TASK ID: CONTRACT-005.7
# TITLE: Commit error contracts
# STATUS: pending
# DEPENDENCIES: CONTRACT-005.6
# ALLOWED FILES: product/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit all error contract types.

## REQUIRED IMPLEMENTATION

```bash
cd product
git add packages/contracts/src/errors
git commit -m "feat(contracts): add error contracts (ErrorCategory, ErrorContract, Validation, Authorization, Conflict, Network) (CONTRACT-005)"
```

## ACCEPTANCE CRITERIA
- [ ] One new commit
- [ ] All 7 files in commit

## TESTS

```bash
cd product
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "CONTRACT-005" || { echo "FAIL"; exit 1; }
for f in category.ts contract.ts validation.ts authorization.ts conflict.ts network.ts index.ts; do
  git show HEAD --name-only --pretty= | grep -q "errors/$f" || { echo "FAIL: $f"; exit 1; }
done
echo "OK"
```
