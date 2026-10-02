import { z } from 'zod';
import { ProjectIdSchema } from '../identity/project-id';
import { UserIdSchema } from '../identity/user-id';
import { DeviceIdSchema } from '../identity/device-id';
import { SessionIdSchema } from '../identity/session-id';
/**
 * The universal envelope for all queries.
 *
 * Queries are read-only. They don't have idempotency keys (queries are
 * naturally idempotent) or causation IDs (queries don't cause events).
 *
 * The result is sent back to the caller (User or Admin). Queries can
 * also be sent to a User's local projection (e.g., from the Admin's UI).
 */
export const QueryEnvelopeSchema = z.object({
    queryId: z.string().uuid(),
    queryType: z.string().min(1).max(128),
    projectId: ProjectIdSchema,
    actorId: UserIdSchema,
    deviceId: DeviceIdSchema,
    sessionId: SessionIdSchema,
    createdAt: z.string().datetime(),
    correlationId: z.string().uuid().optional(),
    payload: z.unknown(),
});
//# sourceMappingURL=envelope.js.map