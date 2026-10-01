# TASK ID: CONTRACT-010.4
# TITLE: Define SnapshotPayload
# STATUS: pending
# DEPENDENCIES: CONTRACT-010.3
# ALLOWED FILES: product/packages/contracts/src/sync/snapshot.ts, product/packages/contracts/src/sync/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `SnapshotPayload` — the typed shape of a User's projection snapshot.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/sync/snapshot.ts`:

```typescript
import { z } from 'zod';
import { ProjectIdSchema } from '../identity/project-id';
import { ProjectSequenceSchema } from '../version/project-sequence';

/**
 * A snapshot of a User's authorized projection.
 *
 * Contains the full data the User is allowed to see, at a given sequence.
 * The User applies this atomically (in a transaction), then continues with deltas.
 *
 * `tables` is keyed by table name (e.g., "patients_projection", "appointments_projection").
 * Each value is the full row set the User can see.
 */
export const SnapshotPayloadSchema = z.object({
  snapshotId: z.string().uuid(),
  projectId: ProjectIdSchema,
  atSequence: ProjectSequenceSchema,
  generatedAt: z.string().datetime(),
  projectionFormatVersion: z.number().int().min(1),
  tables: z.record(z.string(), z.array(z.unknown())),
  tombstones: z.array(z.unknown()), // tombstones the User should know about
});

export type SnapshotPayload = z.infer<typeof SnapshotPayloadSchema>;
```

Update `product/packages/contracts/src/sync/index.ts` to add the export.

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] Generic over table content (z.unknown at this layer, refined by modules)
- [ ] Exported

## TESTS

```bash
cd product
test -f packages/contracts/src/sync/snapshot.ts || { echo "FAIL"; exit 1; }
grep -q "SnapshotPayload" packages/contracts/src/sync/snapshot.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
