# TASK ID: CONTRACT-014.1
# TITLE: Define Project entity
# STATUS: pending
# DEPENDENCIES: CONTRACT-013.4
# ALLOWED FILES: product/packages/contracts/src/project-domain/project.ts, product/packages/contracts/src/project-domain/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define the `Project` entity — the Cloud's record of a project.

## REQUIRED IMPLEMENTATION

```bash
mkdir -p product/packages/contracts/src/project-domain
```

Create the file `product/packages/contracts/src/project-domain/project.ts`:

```typescript
import { z } from 'zod';
import { ProjectIdSchema } from '../identity/project-id';
import { UserIdSchema } from '../identity/user-id';
import { DeviceIdSchema } from '../identity/device-id';
import { ProjectStateSchema } from '../domain/project-state';
import { TimestampSchema } from '../time/timestamp';

/**
 * A project in the Cloud.
 *
 * Each project has:
 *  - one owner (account)
 *  - one Admin device (current, can be replaced)
 *  - one plan
 *  - N memberships
 *  - one business_type (e.g., "medical", "food-lab", future)
 */
export const BusinessType = {
  MEDICAL_RECEPTION: 'medical_reception',
  FOOD_LAB: 'food_lab',
  OTHER: 'other',
} as const;

export type BusinessType = (typeof BusinessType)[keyof typeof BusinessType];

export const ProjectSchema = z.object({
  projectId: ProjectIdSchema,
  ownerUserId: UserIdSchema,
  name: z.string().min(1).max(256),
  businessType: z.nativeEnum(BusinessType),
  planId: z.string().uuid(),
  state: ProjectStateSchema,
  currentAdminDeviceId: DeviceIdSchema.optional(),
  createdAt: TimestampSchema,
  activatedAt: TimestampSchema.optional(),
  suspendedAt: TimestampSchema.optional(),
  archivedAt: TimestampSchema.optional(),
  archivedRetentionUntil: TimestampSchema.optional(), // 30 days after archive
});

export type Project = z.infer<typeof ProjectSchema>;
```

Create `product/packages/contracts/src/project-domain/index.ts`:

```typescript
export { BusinessType } from './project';
export type { BusinessType as BusinessTypeValue } from './project';
export type { Project } from './project';
export { ProjectSchema } from './project';
```

## TESTS

```bash
cd product
test -f packages/contracts/src/project-domain/project.ts || { echo "FAIL"; exit 1; }
grep -q "currentAdminDeviceId" packages/contracts/src/project-domain/project.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
