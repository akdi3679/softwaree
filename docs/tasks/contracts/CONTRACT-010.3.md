# TASK ID: CONTRACT-010.3
# TITLE: Define SyncResponse
# STATUS: pending
# DEPENDENCIES: CONTRACT-010.2
# ALLOWED FILES: product/packages/contracts/src/sync/response.ts, product/packages/contracts/src/sync/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `SyncResponse` — what the Admin sends back. Either a batch of events or a snapshot.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/sync/response.ts`:

```typescript
import { z } from 'zod';
import { ProjectIdSchema } from '../identity/project-id';
import { ProjectSequenceSchema } from '../version/project-sequence';

/**
 * A sync response from Admin to User.
 *
 * The Admin either sends:
 *  - mode: 'events', with a batch of events
 *  - mode: 'snapshot', with a full projection snapshot
 *
 * The User inspects the mode and applies accordingly.
 */
export const SyncResponseSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('events'),
    projectId: ProjectIdSchema,
    fromSequence: ProjectSequenceSchema,
    toSequence: ProjectSequenceSchema,
    events: z.array(z.unknown()), // array of EventEnvelope (typed at the boundary)
    hasMore: z.boolean(),
  }),
  z.object({
    mode: z.literal('snapshot'),
    projectId: ProjectIdSchema,
    atSequence: ProjectSequenceSchema,
    snapshot: z.unknown(), // the projection payload (typed at the boundary)
    projectionFormatVersion: z.number().int().min(1),
  }),
]);

export type SyncResponse = z.infer<typeof SyncResponseSchema>;
```

Update `product/packages/contracts/src/sync/index.ts` to add the export.

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] Discriminated union on mode
- [ ] Two modes: events, snapshot
- [ ] Exported

## TESTS

```bash
cd product
test -f packages/contracts/src/sync/response.ts || { echo "FAIL"; exit 1; }
grep -q "SyncResponse" packages/contracts/src/sync/response.ts || { echo "FAIL"; exit 1; }
grep -q "events" packages/contracts/src/sync/response.ts || { echo "FAIL: no events mode"; exit 1; }
grep -q "snapshot" packages/contracts/src/sync/response.ts || { echo "FAIL: no snapshot mode"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
