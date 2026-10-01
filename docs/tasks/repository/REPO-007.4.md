# TASK ID: REPO-007.4
# TITLE: Create contracts empty barrel
# STATUS: pending
# DEPENDENCIES: REPO-007.3
# ALLOWED FILES: product/packages/contracts/src/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Create the empty barrel export. Submodules will be added by CONTRACT-* tasks later.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/index.ts` with EXACTLY this content:

```typescript
/**
 * @product/contracts
 *
 * Shared TypeScript types, Zod schemas, and brand primitives.
 * This is the single source of truth for data shapes shared between
 * the Admin app, User app, Cloud, and modules.
 *
 * Submodules (populated by CONTRACT-* tasks):
 *   ./identity  - branded ID types and Zod schemas
 *   ./commands  - command envelope and payload types
 *   ./events    - event envelope and payload types
 *   ./errors    - error contracts
 *   ./results   - success/failure result types
 *   ./sync      - sync request/response types
 *   ./version   - version and sequence types
 */

export {};
```

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] Contains the JSDoc comment block
- [ ] `export {};` to make it a module
- [ ] No other exports (those come later)

## TESTS

```bash
cd product
test -f packages/contracts/src/index.ts || { echo "FAIL"; exit 1; }
grep -q "export {};" packages/contracts/src/index.ts || { echo "FAIL: no export"; exit 1; }
grep -q "@product/contracts" packages/contracts/src/index.ts || { echo "FAIL: missing header"; exit 1; }
echo "OK"
```
