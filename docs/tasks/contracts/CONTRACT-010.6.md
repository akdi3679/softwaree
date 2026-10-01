# TASK ID: CONTRACT-010.6
# TITLE: Define SyncAck
# STATUS: pending
# DEPENDENCIES: CONTRACT-010.5
# ALLOWED FILES: product/packages/contracts/src/sync/ack.ts, product/packages/contracts/src/sync/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `SyncAck` — the User's acknowledgment back to the Admin after applying events.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/sync/ack.ts`:

```typescript
import { z } from 'zod';
import { ProjectIdSchema } from '../identity/project-id';
import { ProjectSequenceSchema } from '../version/project-sequence';

/**
 * A sync acknowledgment from User to Admin.
 *
 * Sent after the User has applied a batch of events. The Admin uses
 * this to advance the per-user delivery record.
 */
export const SyncAckSchema = z.object({
  projectId: ProjectIdSchema,
  ackedThroughSequence: ProjectSequenceSchema,
  appliedEventIds: z.array(z.string()), // eventIds actually applied
  skippedEventIds: z.array(z.string()).default([]), // eventIds skipped (e.g., denied)
  failedEventIds: z.array(z.string()).default([]), // eventIds that failed to apply
  ackedAt: z.string().datetime(),
});

export type SyncAck = z.infer<typeof SyncAckSchema>;
```

Update `product/packages/contracts/src/sync/index.ts` to add the export.

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] Tracks applied/skipped/failed event IDs separately
- [ ] Exported

## TESTS

```bash
cd product
test -f packages/contracts/src/sync/ack.ts || { echo "FAIL"; exit 1; }
grep -q "SyncAck" packages/contracts/src/sync/ack.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
