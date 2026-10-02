import { z } from 'zod';
import { CommandIdSchema } from '../identity/command-id';
import { ProjectIdSchema } from '../identity/project-id';
import { DeviceIdSchema } from '../identity/device-id';
import { UserIdSchema } from '../identity/user-id';
import { SessionIdSchema } from '../identity/session-id';
/**
 * The universal envelope for all commands.
 *
 * Every command � whether from User to Admin, or from Admin to Cloud �
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
    commandId: CommandIdSchema,
    commandType: z.string().min(1).max(128),
    projectId: ProjectIdSchema,
    actorId: UserIdSchema,
    deviceId: DeviceIdSchema,
    sessionId: SessionIdSchema,
    createdAt: z.string().datetime(),
    correlationId: z.string().uuid().optional(),
    causationId: z.string().uuid().optional(),
    idempotencyKey: z.string().uuid(),
    payload: z.unknown(),
});
//# sourceMappingURL=envelope.js.map