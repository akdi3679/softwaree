# TASK ID: REPO-007.7
# TITLE: Install contracts dependencies and typecheck
# STATUS: pending
# DEPENDENCIES: REPO-007.6
# ALLOWED FILES: pnpm-lock.yaml, node_modules/ (regenerated)
# FORBIDDEN FILES: any source file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Install dependencies for the workspace and verify the contracts package typechecks cleanly.

## REQUIRED IMPLEMENTATION

```bash
cd product
pnpm install
pnpm --filter @product/contracts typecheck
```

## ACCEPTANCE CRITERIA
- [ ] `pnpm install` succeeds
- [ ] `pnpm --filter @product/contracts typecheck` exits 0
- [ ] No TypeScript errors

## TESTS

```bash
cd product

pnpm --filter @product/contracts typecheck 2>&1 | tail -5
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL: typecheck"; exit 1; }
echo "OK"
```
