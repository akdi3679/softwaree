import { z } from 'zod';
import { EventIdSchema } from '../identity/event-id';
import { UserIdSchema } from '../identity/user-id';
import { DeviceIdSchema } from '../identity/device-id';
/**
 * Tracks the delivery of a single event to a single User.
 *
 * The Admin's outbox has one of these per (event, user) pair.
 * Status transitions: PENDING ? DELIVERED, or PENDING ? DENIED, or PENDING ? FAILED.
 */
export const DeliveryStatus = {
    PENDING: 'pending',
    DELIVERED: 'delivered',
    DENIED: 'denied',
    FAILED: 'failed',
};
export const EventDeliveryRecordSchema = z.object({
    eventId: EventIdSchema,
    userId: UserIdSchema,
    deviceId: DeviceIdSchema,
    status: z.nativeEnum(DeliveryStatus),
    attemptedAt: z.string().datetime().optional(),
    deliveredAt: z.string().datetime().optional(),
    deniedReason: z.string().optional(),
    failureReason: z.string().optional(),
    attemptCount: z.number().int().min(0).default(0),
});
//# sourceMappingURL=delivery.js.map