import { z } from 'zod';
import { EventIdSchema } from '../identity/event-id';
import { ProjectIdSchema } from '../identity/project-id';
import { UserIdSchema } from '../identity/user-id';
import { DeviceIdSchema } from '../identity/device-id';
import { SessionIdSchema } from '../identity/session-id';
/**
 * The universal envelope for all events.
 *
 * Events are emitted by the Admin after a successful state change.
 * They are stored in the outbox and delivered to Users (or stored
 * for audit). The envelope carries identity, ordering, and payload.
 */
export const EventEnvelopeSchema = z.object({
    eventId: EventIdSchema,
    eventType: z.string().min(1).max(128),
    projectId: ProjectIdSchema,
    actorId: UserIdSchema,
    deviceId: DeviceIdSchema,
    sessionId: SessionIdSchema,
    occurredAt: z.string().datetime(),
    correlationId: z.string().uuid().optional(),
    causationId: z.string().uuid().optional(),
    aggregateType: z.string().min(1).max(128),
    aggregateId: z.string().min(1).max(128),
    aggregateVersion: z.number().int().min(1),
    payload: z.unknown(),
});
//# sourceMappingURL=envelope.js.map