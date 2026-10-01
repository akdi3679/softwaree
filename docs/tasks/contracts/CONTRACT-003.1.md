# TASK ID: CONTRACT-003.1
# TITLE: Define ProjectSequence type
# STATUS: pending
# DEPENDENCIES: CONTRACT-001.7
# ALLOWED FILES: product/packages/contracts/src/version/project-sequence.ts, product/packages/contracts/src/version/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `ProjectSequence` — the Admin's global monotonic event sequence. BigInt because it can grow large.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/version/project-sequence.ts`:

```typescript
import { z } from 'zod';
import type { Branded } from '../identity/brand';

/**
 * Admin's global monotonic event sequence per project.
 *
 * Each project has its own sequence starting at 1. Events are numbered
 * strictly in commit order. No gaps. No reuse.
 *
 * Implementation note: stored as BIGINT in SQLite/Postgres. We use bigint
 * in JS, not number, because the values can grow large (millions+).
 */
export type ProjectSequence = Branded<'ProjectSequence', bigint>;

export const ProjectSequenceSchema = z
  .bigint()
  .min(0n)
  .brand<'ProjectSequence'>();
```

Update `product/packages/contracts/src/version/index.ts` (replace the existing empty stub):

```typescript
/**
 * Version and sequence types.
 */

export type { ProjectSequence } from './project-sequence';
export { ProjectSequenceSchema } from './project-sequence';
```

## ACCEPTANCE CRITERIA
- [ ] File `version/project-sequence.ts` exists
- [ ] `ProjectSequence` is a `bigint` with a brand
- [ ] Zod schema accepts non-negative bigint
- [ ] Exported from `version/index.ts`

## TESTS

```bash
cd product
test -f packages/contracts/src/version/project-sequence.ts || { echo "FAIL"; exit 1; }
grep -q "Branded<'ProjectSequence', bigint>" packages/contracts/src/version/project-sequence.ts || { echo "FAIL: wrong brand"; exit 1; }
grep -q "ProjectSequenceSchema" packages/contracts/src/version/project-sequence.ts || { echo "FAIL: no schema"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL: typecheck"; exit 1; }
echo "OK"
```
