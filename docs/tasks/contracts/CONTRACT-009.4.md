# TASK ID: CONTRACT-009.4
# TITLE: Define EventDeliveryRecord
# STATUS: pending
# DEPENDENCIES: CONTRACT-009.3
# ALLOWED FILES: product/packages/contracts/src/events/delivery.ts, product/packages/contracts/src/events/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `EventDeliveryRecord` — tracks delivery of an event to a specific User (success/pending/denied).

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/events/delivery.ts`:

```typescript
import { z } from 'zod';
import { EventIdSchema } from '../identity/event-id';
import { UserIdSchema } from '../identity/user-id';
import { DeviceIdSchema } from '../identity/device-id';

/**
 * Tracks the delivery of a single event to a single User.
 *
 * The Admin's outbox has one of these per (event, user) pair.
 * Status transitions: PENDING → DELIVERED, or PENDING → DENIED, or PENDING → FAILED.
 */
export const DeliveryStatus = {
  PENDING: 'pending',
  DELIVERED: 'delivered',
  DENIED: 'denied', // user lacks permission, no point retrying
  FAILED: 'failed', // transient error, may retry
} as const;

export type DeliveryStatus = (typeof DeliveryStatus)[keyof typeof DeliveryStatus];

export const EventDeliveryRecordSchema = z.object({
  eventId: EventIdSchema,
  userId: UserIdSchema,
  deviceId: DeviceIdSchema, // which user device the event was sent to
  status: z.nativeEnum(DeliveryStatus),
  attemptedAt: z.string().datetime().optional(),
  deliveredAt: z.string().datetime().optional(),
  deniedReason: z.string().optional(),
  failureReason: z.string().optional(),
  attemptCount: z.number().int().min(0).default(0),
});

export type EventDeliveryRecord = z.infer<typeof EventDeliveryRecordSchema>;
```

Update `product/packages/contracts/src/events/index.ts` to add the export.

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] 4 delivery statuses defined
- [ ] Tracks per-(event, user) state
- [ ] Exported

## TESTS

```bash
cd product
test -f packages/contracts/src/events/delivery.ts || { echo "FAIL"; exit 1; }
grep -q "EventDeliveryRecord" packages/contracts/src/events/delivery.ts || { echo "FAIL"; exit 1; }
grep -q "PENDING" packages/contracts/src/events/delivery.ts || { echo "FAIL: no pending"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
