# TASK ID: CONTRACT-017.3
# TITLE: Final commit of contracts package
# STATUS: pending
# DEPENDENCIES: CONTRACT-017.2
# ALLOWED FILES: product/.git/ only
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Final commit of the contracts package. Includes README and test config.

## REQUIRED IMPLEMENTATION

```bash
cd product
git add packages/contracts
git commit -m "feat(contracts): add README, vitest config (CONTRACT-017)"
```

After this, the contracts package is complete. All 88 CONTRACT micro-tasks are done.

## TESTS

```bash
cd product
MSG=$(git log -1 --pretty=%s)
echo "$MSG" | grep -q "CONTRACT-017" || { echo "FAIL"; exit 1; }
git show HEAD --name-only --pretty= | grep -q "packages/contracts/README.md" || { echo "FAIL"; exit 1; }
git show HEAD --name-only --pretty= | grep -q "packages/contracts/vitest.config.ts" || { echo "FAIL"; exit 1; }
echo "OK"
```
