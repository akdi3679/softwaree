# TASK ID: CONTRACT-017.1
# TITLE: Add contracts package test setup
# STATUS: pending
# DEPENDENCIES: CONTRACT-016.6
# ALLOWED FILES: product/packages/contracts/vitest.config.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 2 minutes

## OBJECTIVE
Add a vitest config for the contracts package so tests run cleanly.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/index.ts', '**/*.schema.ts'],
    },
  },
});
```

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] `pnpm --filter @product/contracts test` runs cleanly

## TESTS

```bash
cd product
test -f packages/contracts/vitest.config.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts test > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
