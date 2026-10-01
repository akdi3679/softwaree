# TASK ID: CONTRACT-007.3
# TITLE: Define CommandPolicy enum
# STATUS: pending
# DEPENDENCIES: CONTRACT-007.2
# ALLOWED FILES: product/packages/contracts/src/commands/policy.ts, product/packages/contracts/src/commands/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `CommandPolicy` — what a command requires (Admin online, Cloud online, local-only, etc.). Used in v2 for offline write policy.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/commands/policy.ts`:

```typescript
import { z } from 'zod';

/**
 * Where a command can be processed.
 *
 * In v1, all commands with non-LOCAL_ONLY policy require Admin to be online.
 * In v2, OFFLINE_QUEUEABLE commands may be queued when Admin is offline.
 *
 * - LOCAL_ONLY: command is processed entirely on the User app. No Admin needed.
 *   Example: a "draft note" command.
 * - OFFLINE_QUEUEABLE: command may be queued locally and sent when Admin returns.
 *   v2 feature. Not used in v1.
 * - ADMIN_REQUIRED: command must be processed by the Admin. If Admin offline, command fails.
 *   Most business commands fall here.
 * - CLOUD_REQUIRED: command must be processed by the Cloud. If Cloud offline, command fails.
 *   Account, billing, plan changes.
 */
export const CommandPolicy = {
  LOCAL_ONLY: 'local_only',
  OFFLINE_QUEUEABLE: 'offline_queueable',
  ADMIN_REQUIRED: 'admin_required',
  CLOUD_REQUIRED: 'cloud_required',
} as const;

export type CommandPolicy = (typeof CommandPolicy)[keyof typeof CommandPolicy];

export const CommandPolicySchema = z.nativeEnum(CommandPolicy);
```

Update `product/packages/contracts/src/commands/index.ts` to add the export.

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] 4 policies defined
- [ ] Exported

## TESTS

```bash
cd product
test -f packages/contracts/src/commands/policy.ts || { echo "FAIL"; exit 1; }
grep -q "CommandPolicy" packages/contracts/src/commands/policy.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
