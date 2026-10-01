# TASK ID: CONTRACT-003.2
# TITLE: Define AggregateVersion type
# STATUS: pending
# DEPENDENCIES: CONTRACT-003.1
# ALLOWED FILES: product/packages/contracts/src/version/aggregate-version.ts, product/packages/contracts/src/version/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `AggregateVersion` — per-entity optimistic concurrency version. Distinct from ProjectSequence.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/version/aggregate-version.ts`:

```typescript
import { z } from 'zod';
import type { Branded } from '../identity/brand';

/**
 * Per-aggregate optimistic concurrency version.
 *
 * Each business entity (patient, appointment, lab sample, etc.) has its own
 * version counter. Starts at 1. Increments on every successful update.
 *
 * Used for optimistic concurrency control: an update specifies the expected
 * version, the update only succeeds if the version matches.
 */
export type AggregateVersion = Branded<'AggregateVersion', number>;

export const AggregateVersionSchema = z
  .number()
  .int()
  .min(1)
  .brand<'AggregateVersion'>();
```

Update `product/packages/contracts/src/version/index.ts`:

```typescript
/**
 * Version and sequence types.
 */

export type { ProjectSequence } from './project-sequence';
export { ProjectSequenceSchema } from './project-sequence';
export type { AggregateVersion } from './aggregate-version';
export { AggregateVersionSchema } from './aggregate-version';
```

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] `AggregateVersion` is a `number` with a brand
- [ ] Must be a positive integer (>= 1)
- [ ] Exported

## TESTS

```bash
cd product
test -f packages/contracts/src/version/aggregate-version.ts || { echo "FAIL"; exit 1; }
grep -q "Branded<'AggregateVersion', number>" packages/contracts/src/version/aggregate-version.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
