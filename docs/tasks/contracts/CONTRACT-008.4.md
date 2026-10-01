# TASK ID: CONTRACT-008.4
# TITLE: Define QueryResult wrapper
# STATUS: pending
# DEPENDENCIES: CONTRACT-008.3
# ALLOWED FILES: product/packages/contracts/src/queries/result.ts, product/packages/contracts/src/queries/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `QueryResult<T>` — the success result of a query.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/queries/result.ts`:

```typescript
/**
 * The success result of a query.
 *
 * - `result`: the typed result payload
 * - `durationMs`: query execution time
 * - `cached`: true if the result came from a cache, not a fresh query
 */
export interface QueryResult<TResult> {
  readonly result: TResult;
  readonly durationMs: number;
  readonly cached: boolean;
}
```

Update `product/packages/contracts/src/queries/index.ts` to add the export.

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] Has cached flag

## TESTS

```bash
cd product
test -f packages/contracts/src/queries/result.ts || { echo "FAIL"; exit 1; }
grep -q "QueryResult" packages/contracts/src/queries/result.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
