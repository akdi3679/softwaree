# TASK ID: CONTRACT-008.1
# TITLE: Define QueryEnvelope
# STATUS: pending
# DEPENDENCIES: CONTRACT-007.7
# ALLOWED FILES: product/packages/contracts/src/queries/envelope.ts, product/packages/contracts/src/queries/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `QueryEnvelope<TPayload>` — the universal wrapper for queries. Read-only counterpart to CommandEnvelope.

## REQUIRED IMPLEMENTATION

```bash
cd product
mkdir -p packages/contracts/src/queries
```

Create the file `product/packages/contracts/src/queries/envelope.ts`:

```typescript
import { z } from 'zod';
import { ProjectIdSchema } from '../identity/project-id';
import { UserIdSchema } from '../identity/user-id';
import { DeviceIdSchema } from '../identity/device-id';
import { SessionIdSchema } from '../identity/session-id';

/**
 * The universal envelope for all queries.
 *
 * Queries are read-only. They don't have idempotency keys (queries are
 * naturally idempotent) or causation IDs (queries don't cause events).
 *
 * The result is sent back to the caller (User or Admin). Queries can
 * also be sent to a User's local projection (e.g., from the Admin's UI).
 */
export const QueryEnvelopeSchema = z.object({
  queryId: z.string().uuid(),
  queryType: z.string().min(1).max(128),
  projectId: ProjectIdSchema,
  actorId: UserIdSchema,
  deviceId: DeviceIdSchema,
  sessionId: SessionIdSchema,
  createdAt: z.string().datetime(),
  correlationId: z.string().uuid().optional(),
  payload: z.unknown(),
});

export type QueryEnvelope<TPayload = unknown> = Omit<
  z.infer<typeof QueryEnvelopeSchema>,
  'payload'
> & { payload: TPayload };
```

Create the file `product/packages/contracts/src/queries/index.ts`:

```typescript
/**
 * Query envelope and payload types.
 */

export type { QueryEnvelope } from './envelope';
export { QueryEnvelopeSchema } from './envelope';
```

## ACCEPTANCE CRITERIA
- [ ] File exists at `queries/envelope.ts`
- [ ] `QueryEnvelope<TPayload>` is generic
- [ ] No idempotency key, no causationId (queries are read-only)
- [ ] Exported

## TESTS

```bash
cd product
test -f packages/contracts/src/queries/envelope.ts || { echo "FAIL"; exit 1; }
test -f packages/contracts/src/queries/index.ts || { echo "FAIL: no index"; exit 1; }
grep -q "QueryEnvelope" packages/contracts/src/queries/envelope.ts || { echo "FAIL"; exit 1; }
grep -v -q "idempotencyKey" packages/contracts/src/queries/envelope.ts || { echo "FAIL: queries should not have idempotency"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
