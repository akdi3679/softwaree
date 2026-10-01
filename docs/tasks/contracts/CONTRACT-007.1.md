# TASK ID: CONTRACT-007.1
# TITLE: Define CommandEnvelope base interface
# STATUS: pending
# DEPENDENCIES: CONTRACT-006.3
# ALLOWED FILES: product/packages/contracts/src/commands/envelope.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Define `CommandEnvelope<TPayload>` — the universal wrapper for all commands. Every command sent from User to Admin (or Admin to Cloud) uses this shape.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/commands/envelope.ts`:

```typescript
import { z } from 'zod';
import type { CommandIdSchema } from '../identity/command-id';
import { CommandIdSchema as CommandIdSchemaValue } from '../identity/command-id';
import type { ProjectIdSchema } from '../identity/project-id';
import { ProjectIdSchema as ProjectIdSchemaValue } from '../identity/project-id';
import type { DeviceIdSchema } from '../identity/device-id';
import { DeviceIdSchema as DeviceIdSchemaValue } from '../identity/device-id';
import type { UserIdSchema } from '../identity/user-id';
import { UserIdSchema as UserIdSchemaValue } from '../identity/user-id';
import type { SessionIdSchema } from '../identity/session-id';
import { SessionIdSchema as SessionIdSchemaValue } from '../identity/session-id';

/**
 * The universal envelope for all commands.
 *
 * Every command — whether from User to Admin, or from Admin to Cloud —
 * is wrapped in this envelope. The envelope carries:
 *  - identity (command, project, actor, device, session)
 *  - correlation/causation for tracing
 *  - idempotency key (so retries are safe)
 *  - payload (the actual command, type-specific)
 *
 * The envelope is generic over the payload type. Specific commands
 * (CreatePatient, UpdateAppointment, etc.) are defined as separate
 * Zod schemas that extend this envelope.
 */
export const CommandEnvelopeSchema = z.object({
  commandId: CommandIdSchemaValue,
  commandType: z.string().min(1).max(128), // e.g., "patient.create"
  projectId: ProjectIdSchemaValue,
  actorId: UserIdSchemaValue, // who initiated the command
  deviceId: DeviceIdSchemaValue, // which device sent it
  sessionId: SessionIdSchemaValue,
  createdAt: z.string().datetime(),
  correlationId: z.string().uuid().optional(),
  causationId: z.string().uuid().optional(),
  idempotencyKey: z.string().uuid(),
  payload: z.unknown(), // refined by specific command types
});

export type CommandEnvelope<TPayload = unknown> = Omit<
  z.infer<typeof CommandEnvelopeSchema>,
  'payload'
> & {
  payload: TPayload;
};
```

## ACCEPTANCE CRITERIA
- [ ] File exists at `commands/envelope.ts`
- [ ] `CommandEnvelopeSchema` validates the full shape
- [ ] `CommandEnvelope<TPayload>` is generic over payload type
- [ ] All required fields present: commandId, commandType, projectId, actorId, deviceId, sessionId, createdAt, idempotencyKey, payload
- [ ] Optional: correlationId, causationId

## TESTS

```bash
cd product
test -f packages/contracts/src/commands/envelope.ts || { echo "FAIL"; exit 1; }
grep -q "CommandEnvelopeSchema" packages/contracts/src/commands/envelope.ts || { echo "FAIL"; exit 1; }
grep -q "idempotencyKey" packages/contracts/src/commands/envelope.ts || { echo "FAIL: no idempotency"; exit 1; }
grep -q "<TPayload" packages/contracts/src/commands/envelope.ts || { echo "FAIL: not generic"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL: typecheck"; exit 1; }
echo "OK"
```
