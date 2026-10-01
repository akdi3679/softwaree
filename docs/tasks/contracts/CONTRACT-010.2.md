# TASK ID: CONTRACT-010.2
# TITLE: Define SyncRequest
# STATUS: pending
# DEPENDENCIES: CONTRACT-010.1
# ALLOWED FILES: product/packages/contracts/src/sync/request.ts, product/packages/contracts/src/sync/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `SyncRequest` — what a User sends to the Admin to start a sync session.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/sync/request.ts`:

```typescript
import { z } from 'zod';
import { ProjectIdSchema } from '../identity/project-id';
import { ProjectSequenceSchema } from '../version/project-sequence';

/**
 * A sync request from User to Admin.
 *
 * User says: "Give me everything since sequence X, in batches of Y,
 * starting at sequence X+1."
 */
export const SyncRequestSchema = z.object({
  projectId: ProjectIdSchema,
  lastAppliedSequence: ProjectSequenceSchema,
  maxEvents: z.number().int().min(1).max(1000).default(100),
  requestedProjectionFormatVersion: z.number().int().min(1),
});

export type SyncRequest = z.infer<typeof SyncRequestSchema>;
```

Update `product/packages/contracts/src/sync/index.ts` to add the export.

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] Has lastAppliedSequence, maxEvents, requestedProjectionFormatVersion
- [ ] Exported

## TESTS

```bash
cd product
test -f packages/contracts/src/sync/request.ts || { echo "FAIL"; exit 1; }
grep -q "SyncRequest" packages/contracts/src/sync/request.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
