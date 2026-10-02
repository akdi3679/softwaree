import { z } from 'zod';
import { ProjectIdSchema } from '../identity/project-id';
import { ProjectSequenceSchema } from '../version/project-sequence';
/**
 * A sync response from Admin to User.
 *
 * The Admin either sends:
 *  - mode: 'events', with a batch of events
 *  - mode: 'snapshot', with a full projection snapshot
 *
 * The User inspects the mode and applies accordingly.
 */
export const SyncResponseSchema = z.discriminatedUnion('mode', [
    z.object({
        mode: z.literal('events'),
        projectId: ProjectIdSchema,
        fromSequence: ProjectSequenceSchema,
        toSequence: ProjectSequenceSchema,
        events: z.array(z.unknown()),
        hasMore: z.boolean(),
    }),
    z.object({
        mode: z.literal('snapshot'),
        projectId: ProjectIdSchema,
        atSequence: ProjectSequenceSchema,
        snapshot: z.unknown(),
        projectionFormatVersion: z.number().int().min(1),
    }),
]);
//# sourceMappingURL=response.js.map