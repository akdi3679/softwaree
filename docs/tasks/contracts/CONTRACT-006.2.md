# TASK ID: CONTRACT-006.2
# TITLE: Add Result type tests
# STATUS: pending
# DEPENDENCIES: CONTRACT-006.1
# ALLOWED FILES: product/packages/contracts/src/results/result.test.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Add tests for the Result type. Locks in the contract.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/results/result.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { err, ok, type Result } from './result';

describe('Result', () => {
  it('ok() creates a success result', () => {
    const r = ok(42);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toBe(42);
    }
  });

  it('err() creates a failure result', () => {
    const r = err(new Error('oops'));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.message).toBe('oops');
    }
  });

  it('narrows correctly on .ok', () => {
    const r: Result<number, string> = Math.random() > 0.5 ? ok(1) : err('nope');
    if (r.ok) {
      // @ts-expect-error — value should be number, not string
      const wrong: string = r.value;
      const right: number = r.value;
      expect(typeof right).toBe('number');
    } else {
      // @ts-expect-error — error should be string, not number
      const wrong: number = r.error;
      const right: string = r.error;
      expect(typeof right).toBe('string');
    }
  });
});
```

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] Tests pass
- [ ] @ts-expect-error directives validate the discriminated union narrowing

## TESTS

```bash
cd product
test -f packages/contracts/src/results/result.test.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts test 2>&1 | tail -20
pnpm --filter @product/contracts test > /dev/null 2>&1 || { echo "FAIL: tests failed"; exit 1; }
echo "OK"
```
