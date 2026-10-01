# TASK ID: CONTRACT-015.2
# TITLE: Define PlanSubscription entity
# STATUS: pending
# DEPENDENCIES: CONTRACT-015.1
# ALLOWED FILES: product/packages/contracts/src/plan-domain/subscription.ts, product/packages/contracts/src/plan-domain/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define the `PlanSubscription` — a project's current plan.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/plan-domain/subscription.ts`:

```typescript
import { z } from 'zod';
import { ProjectIdSchema } from '../identity/project-id';
import { TimestampSchema } from '../time/timestamp';

/**
 * A project's current subscription to a plan.
 *
 * Plan changes are recorded as new subscription records, with `supersededBy`
 * linking them.
 */
export const SubscriptionStatus = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const;

export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const PlanSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid(),
  projectId: ProjectIdSchema,
  planId: z.string().uuid(),
  status: z.nativeEnum(SubscriptionStatus),
  startedAt: TimestampSchema,
  endedAt: TimestampSchema.optional(),
  supersededBy: z.string().uuid().optional(),
  // Billing cycle
  currentPeriodStart: TimestampSchema,
  currentPeriodEnd: TimestampSchema,
  cancelAtPeriodEnd: z.boolean().default(false),
});

export type PlanSubscription = z.infer<typeof PlanSubscriptionSchema>;
```

Update `product/packages/contracts/src/plan-domain/index.ts` to add exports.

## TESTS

```bash
cd product
test -f packages/contracts/src/plan-domain/subscription.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
