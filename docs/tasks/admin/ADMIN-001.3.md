# TASK ID: ADMIN-001.3
# TITLE: Add @product/cloud-client dependency
# STATUS: pending
# DEPENDENCIES: ADMIN-001.2
# ALLOWED FILES: product/apps/admin/package.json, product/apps/admin/src/lib/cloud.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add the `@product/cloud-client` workspace dependency and create a re-export.

## REQUIRED IMPLEMENTATION

```bash
cd product
pnpm --filter admin add @product/cloud-client@workspace:*
```

Create `product/apps/admin/src/lib/cloud.ts`:

```typescript
export * from '@product/cloud-client';
```

## TESTS

```bash
cd product
test -f apps/admin/src/lib/cloud.ts || { echo "FAIL"; exit 1; }
node -e "
const p = require('./apps/admin/package.json');
if (!p.dependencies?.['@product/cloud-client']) process.exit(1);
"
pnpm --filter admin typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
