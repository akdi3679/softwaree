# TASK ID: CONTRACT-007.4
# TITLE: Define CommandDescriptor
# STATUS: pending
# DEPENDENCIES: CONTRACT-007.3
# ALLOWED FILES: product/packages/contracts/src/commands/descriptor.ts, product/packages/contracts/src/commands/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `CommandDescriptor<TPayload, TResult>` — the metadata for a specific command type. Modules and the core register commands via this descriptor.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/commands/descriptor.ts`:

```typescript
import { z } from 'zod';
import { CommandPolicySchema } from './policy';

/**
 * Metadata for a specific command type. Modules and core register
 * commands by providing a descriptor.
 *
 * - `commandType`: unique identifier (e.g., "patient.create")
 * - `payloadSchema`: Zod schema validating the payload
 * - `resultSchema`: Zod schema validating the success result
 * - `policy`: where the command can be processed
 * - `requiredPermission`: the permission required to execute
 * - `version`: command API version (for backwards compatibility)
 */
export interface CommandDescriptor<TPayload, TResult> {
  readonly commandType: string;
  readonly version: number;
  readonly payloadSchema: z.ZodType<TPayload>;
  readonly resultSchema: z.ZodType<TResult>;
  readonly policy: z.infer<typeof CommandPolicySchema>;
  readonly requiredPermission: string;
  readonly description: string;
}
```

Update `product/packages/contracts/src/commands/index.ts` to add the export.

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] `CommandDescriptor<TPayload, TResult>` is generic over payload and result types
- [ ] Has commandType, version, payloadSchema, resultSchema, policy, requiredPermission, description

## TESTS

```bash
cd product
test -f packages/contracts/src/commands/descriptor.ts || { echo "FAIL"; exit 1; }
grep -q "CommandDescriptor" packages/contracts/src/commands/descriptor.ts || { echo "FAIL: no descriptor"; exit 1; }
grep -q "payloadSchema" packages/contracts/src/commands/descriptor.ts || { echo "FAIL: no payload schema"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
