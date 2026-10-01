# TASK ID: ADMIN-001.2
# TITLE: Add @product/contracts dependency
# STATUS: pending
# DEPENDENCIES: ADMIN-001.1
# ALLOWED FILES: product/apps/admin/package.json, product/apps/admin/src/lib/contracts.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add the `@product/contracts` workspace dependency and create a re-export module.

## REQUIRED IMPLEMENTATION

```bash
cd product
pnpm --filter admin add @product/contracts@workspace:*
```

Create the file `product/apps/admin/src/lib/contracts.ts`:

```typescript
/**
 * Re-exports from @product/contracts for ergonomic imports.
 * Use this instead of importing directly from @product/contracts in most places.
 */
export * from '@product/contracts';
export * from '@product/contracts/identity';
export * from '@product/contracts/commands';
export * from '@product/contracts/events';
export * from '@product/contracts/errors';
export * from '@product/contracts/results';
export * from '@product/contracts/sync';
export * from '@product/contracts/version';
```

## ACCEPTANCE CRITERIA
- [ ] `package.json` lists `@product/contracts` as workspace dependency
- [ ] `src/lib/contracts.ts` exists with re-exports
- [ ] `pnpm typecheck` passes

## TESTS

```bash
cd product
test -f apps/admin/src/lib/contracts.ts || { echo "FAIL"; exit 1; }
node -e "
const p = require('./apps/admin/package.json');
if (!p.dependencies?.['@product/contracts']) {
  console.log('missing dep');
  process.exit(1);
}
"
pnpm install
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL: typecheck"; exit 1; }
echo "OK"
```
