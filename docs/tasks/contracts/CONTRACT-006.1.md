# TASK ID: CONTRACT-006.1
# TITLE: Define Result discriminated union
# STATUS: pending
# DEPENDENCIES: CONTRACT-005.7
# ALLOWED FILES: product/packages/contracts/src/results/result.ts, product/packages/contracts/src/results/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define the `Result<T, E>` discriminated union — replaces exceptions at the contract boundary.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/results/result.ts`:

```typescript
/**
 * Result<T, E> — a discriminated union for success/failure.
 *
 * Used at every IPC/network boundary instead of throwing exceptions.
 * Forces callers to handle the failure case explicitly.
 *
 * @example
 *   const r: Result<Patient, ValidationError> = await createPatient(input);
 *   if (r.ok) {
 *     console.log(r.value.name);
 *   } else {
 *     console.log(r.error.code);
 *   }
 */
export type Result<TValue, TError> =
  | { readonly ok: true; readonly value: TValue }
  | { readonly ok: false; readonly error: TError };

/**
 * Helper: build a success result.
 */
export function ok<TValue>(value: TValue): Result<TValue, never> {
  return { ok: true, value };
}

/**
 * Helper: build a failure result.
 */
export function err<TError>(error: TError): Result<never, TError> {
  return { ok: false, error };
}
```

Create the file `product/packages/contracts/src/results/index.ts`:

```typescript
/**
 * Result types.
 */

export type { Result } from './result';
export { ok, err } from './result';
```

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] `Result<T, E>` is a discriminated union with `ok: true | false`
- [ ] `ok()` and `err()` helper functions
- [ ] Helpers properly typed

## TESTS

```bash
cd product
test -f packages/contracts/src/results/result.ts || { echo "FAIL"; exit 1; }
test -f packages/contracts/src/results/index.ts || { echo "FAIL: no index"; exit 1; }
grep -q "export type Result" packages/contracts/src/results/result.ts || { echo "FAIL: no Result type"; exit 1; }
grep -q "export function ok" packages/contracts/src/results/result.ts || { echo "FAIL: no ok fn"; exit 1; }
grep -q "export function err" packages/contracts/src/results/result.ts || { echo "FAIL: no err fn"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
