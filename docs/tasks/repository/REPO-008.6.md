# TASK ID: REPO-008.6
# TITLE: Install and typecheck cloud-client
# STATUS: pending
# DEPENDENCIES: REPO-008.5
# ALLOWED FILES: pnpm-lock.yaml, node_modules/
# FORBIDDEN FILES: any source file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Install and verify cloud-client typechecks.

## REQUIRED IMPLEMENTATION

```bash
cd product
pnpm install
pnpm --filter @product/cloud-client typecheck
```

## ACCEPTANCE CRITERIA
- [ ] Typecheck passes (exit 0)
- [ ] No errors about missing @product/contracts

## TESTS

```bash
cd product
pnpm --filter @product/cloud-client typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
