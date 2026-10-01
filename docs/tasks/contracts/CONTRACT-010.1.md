# TASK ID: CONTRACT-010.1
# TITLE: Define SyncPosition
# STATUS: pending
# DEPENDENCIES: CONTRACT-009.7
# ALLOWED FILES: product/packages/contracts/src/sync/position.ts, product/packages/contracts/src/sync/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `SyncPosition` — a User's per-project sync cursor. Stores the last applied event sequence and version info.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/sync/position.ts`:

```typescript
import { z } from 'zod';
import { ProjectIdSchema } from '../identity/project-id';
import { UserIdSchema } from '../identity/user-id';
import { ProjectSequenceSchema } from '../version/project-sequence';
import { SchemaVersionSchema } from '../version/schema-version';

/**
 * A User's sync position for a project.
 *
 * Tracks the last event sequence the User has applied to its local projection.
 * Also tracks the projection format version so the User knows when a snapshot
 * is needed due to format changes.
 */
export const SyncPositionSchema = z.object({
  projectId: ProjectIdSchema,
  userId: UserIdSchema,
  lastAppliedSequence: ProjectSequenceSchema,
  projectionFormatVersion: z.number().int().min(1),
  schemaVersion: SchemaVersionSchema,
  snapshotAt: z.string().datetime().optional(), // when was the last snapshot applied
  updatedAt: z.string().datetime(),
});

export type SyncPosition = z.infer<typeof SyncPositionSchema>;
```

Create the file `product/packages/contracts/src/sync/index.ts`:

```typescript
/**
 * Sync types.
 */

export type { SyncPosition } from './position';
export { SyncPositionSchema } from './position';
```

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] Tracks per-(user, project) cursor
- [ ] Has schema + projection format version
- [ ] Exported

## TESTS

```bash
cd product
test -f packages/contracts/src/sync/position.ts || { echo "FAIL"; exit 1; }
test -f packages/contracts/src/sync/index.ts || { echo "FAIL: no index"; exit 1; }
grep -q "SyncPosition" packages/contracts/src/sync/position.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
