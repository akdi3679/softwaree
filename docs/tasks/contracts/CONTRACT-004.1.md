# TASK ID: CONTRACT-004.1
# TITLE: Define Timestamp type
# STATUS: pending
# DEPENDENCIES: CONTRACT-003.4
# ALLOWED FILES: product/packages/contracts/src/time/timestamp.ts, product/packages/contracts/src/time/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `Timestamp` — a brand on `Date` for use in envelopes, audit, events. Helps distinguish from arbitrary dates.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/time/timestamp.ts`:

```typescript
import { z } from 'zod';
import type { Branded } from '../identity/brand';

/**
 * An instant in time, as a Date.
 *
 * Used in all envelopes, audit entries, and events. Branded so it cannot
 * be confused with arbitrary Date values.
 */
export type Timestamp = Branded<'Timestamp', Date>;

export const TimestampSchema = z
  .date()
  .brand<'Timestamp'>();
```

Create the file `product/packages/contracts/src/time/index.ts`:

```typescript
/**
 * Time types.
 */

export type { Timestamp } from './timestamp';
export { TimestampSchema } from './timestamp';
```

## ACCEPTANCE CRITERIA
- [ ] File `time/timestamp.ts` exists
- [ ] `time/index.ts` exists
- [ ] `Timestamp` is a `Date` with a brand
- [ ] Exported

## TESTS

```bash
cd product
test -f packages/contracts/src/time/timestamp.ts || { echo "FAIL"; exit 1; }
test -f packages/contracts/src/time/index.ts || { echo "FAIL: no index"; exit 1; }
grep -q "Branded<'Timestamp', Date>" packages/contracts/src/time/timestamp.ts || { echo "FAIL: wrong brand"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
