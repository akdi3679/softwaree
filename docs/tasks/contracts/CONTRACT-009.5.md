# TASK ID: CONTRACT-009.5
# TITLE: Define Tombstone for soft-deleted entities
# STATUS: pending
# DEPENDENCIES: CONTRACT-009.4
# ALLOWED FILES: product/packages/contracts/src/events/tombstone.ts, product/packages/contracts/src/events/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `Tombstone` — records a soft-deleted entity so a User's projection knows to drop it.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/events/tombstone.ts`:

```typescript
import { z } from 'zod';
import { ProjectIdSchema } from '../identity/project-id';
import { ProjectSequenceSchema } from '../version/project-sequence';

/**
 * A tombstone records that an entity was soft-deleted.
 *
 * The User's projection must keep tombstones for a project so that
 * late-arriving events for the deleted entity are rejected (not
 * re-creating the record).
 */
export const TombstoneSchema = z.object({
  projectId: ProjectIdSchema,
  entityType: z.string().min(1).max(128), // e.g., "patient"
  entityId: z.string().min(1).max(128),
  deletedAt: z.string().datetime(),
  deletedBySequence: ProjectSequenceSchema, // the sequence number when deletion happened
  deletedByUserId: z.string().min(1), // who deleted it
  reason: z.string().optional(), // optional human-readable reason
});

export type Tombstone = z.infer<typeof TombstoneSchema>;
```

Update `product/packages/contracts/src/events/index.ts` to add the export.

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] Records entity type, id, deletion sequence
- [ ] Exported

## TESTS

```bash
cd product
test -f packages/contracts/src/events/tombstone.ts || { echo "FAIL"; exit 1; }
grep -q "Tombstone" packages/contracts/src/events/tombstone.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
