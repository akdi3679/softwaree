# TASK ID: CONTRACT-010.7
# TITLE: Define SyncHello handshake
# STATUS: pending
# DEPENDENCIES: CONTRACT-010.6
# ALLOWED FILES: product/packages/contracts/src/sync/hello.ts, product/packages/contracts/src/sync/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `SyncHello` — the first message of a sync session. Performs mutual handshake.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/sync/hello.ts`:

```typescript
import { z } from 'zod';
import { ProjectIdSchema } from '../identity/project-id';
import { UserIdSchema } from '../identity/user-id';
import { DeviceIdSchema } from '../identity/device-id';
import { SessionIdSchema } from '../identity/session-id';
import { ProjectSequenceSchema } from '../version/project-sequence';
import { SchemaVersionSchema } from '../version/schema-version';

/**
 * The opening message of a sync session. Sent by User to Admin.
 *
 * Includes the User's identity, its last known cursor, and the
 * schemas it understands. The Admin responds with what it can serve.
 */
export const SyncHelloSchema = z.object({
  protocolVersion: z.literal(1), // bump on protocol breaks
  projectId: ProjectIdSchema,
  userId: UserIdSchema,
  deviceId: DeviceIdSchema,
  sessionId: SessionIdSchema,
  lastAppliedSequence: ProjectSequenceSchema,
  schemaVersion: SchemaVersionSchema,
  projectionFormatVersion: z.number().int().min(1),
  clientCapabilities: z.array(z.string()).default([]), // e.g., ["wasmtime", "zstd-compression"]
});

export type SyncHello = z.infer<typeof SyncHelloSchema>;
```

Update `product/packages/contracts/src/sync/index.ts` to add the export.

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] Includes protocol version, identity, cursor, capabilities
- [ ] Exported

## TESTS

```bash
cd product
test -f packages/contracts/src/sync/hello.ts || { echo "FAIL"; exit 1; }
grep -q "SyncHello" packages/contracts/src/sync/hello.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
