# TASK ID: CONTRACT-016.4
# TITLE: Define ModuleRegistryEntry
# STATUS: pending
# DEPENDENCIES: CONTRACT-016.3
# ALLOWED FILES: product/packages/contracts/src/module-domain/registry-entry.ts, product/packages/contracts/src/module-domain/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `ModuleRegistryEntry` — the per-project record of an installed module.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/module-domain/registry-entry.ts`:

```typescript
import { z } from 'zod';
import { ProjectIdSchema } from '../identity/project-id';
import { UserIdSchema } from '../identity/user-id';
import { DeviceIdSchema } from '../identity/device-id';
import { ModuleStateSchema } from '../domain/module-state';
import { TimestampSchema } from '../time/timestamp';

/**
 * A module's installation record within a project.
 *
 * The Admin keeps one of these per (project, module_id).
 * Tied to a specific version — upgrading creates a new entry.
 */
export const ModuleRegistryEntrySchema = z.object({
  entryId: z.string().uuid(),
  projectId: ProjectIdSchema,
  moduleId: z.string(),
  version: z.string(),
  state: ModuleStateSchema,
  installedAt: TimestampSchema,
  installedByUserId: UserIdSchema,
  installedByDeviceId: DeviceIdSchema,
  // Local binary path within the project directory
  binaryPath: z.string(),
  // Schema version of this module's tables
  schemaVersion: z.number().int().min(1),
  // When the license expires
  licenseExpiresAt: TimestampSchema.optional(),
  // Last verification timestamp (we re-verify at load time)
  lastVerifiedAt: TimestampSchema.optional(),
});

export type ModuleRegistryEntry = z.infer<typeof ModuleRegistryEntrySchema>;
```

Update `product/packages/contracts/src/module-domain/index.ts` to add exports.

## TESTS

```bash
cd product
test -f packages/contracts/src/module-domain/registry-entry.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
