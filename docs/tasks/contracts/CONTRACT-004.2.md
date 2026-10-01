# TASK ID: CONTRACT-004.2
# TITLE: Define DurationMillis type
# STATUS: pending
# DEPENDENCIES: CONTRACT-004.1
# ALLOWED FILES: product/packages/contracts/src/time/duration-millis.ts, product/packages/contracts/src/time/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `DurationMillis` — a duration in milliseconds, branded so it can't be confused with raw numbers.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/time/duration-millis.ts`:

```typescript
import { z } from 'zod';
import type { Branded } from '../identity/brand';

/**
 * A duration in milliseconds.
 *
 * Used for session TTLs, timeouts, heartbeats, lease durations.
 * Branded so it cannot be confused with raw numbers.
 */
export type DurationMillis = Branded<'DurationMillis', number>;

export const DurationMillisSchema = z
  .number()
  .int()
  .min(0)
  .brand<'DurationMillis'>();
```

Update `product/packages/contracts/src/time/index.ts`:

```typescript
/**
 * Time types.
 */

export type { Timestamp } from './timestamp';
export { TimestampSchema } from './timestamp';
export type { DurationMillis } from './duration-millis';
export { DurationMillisSchema } from './duration-millis';
```

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] `DurationMillis` is a non-negative integer with a brand
- [ ] Exported

## TESTS

```bash
cd product
test -f packages/contracts/src/time/duration-millis.ts || { echo "FAIL"; exit 1; }
grep -q "Branded<'DurationMillis', number>" packages/contracts/src/time/duration-millis.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
