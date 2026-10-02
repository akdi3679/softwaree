import { z } from 'zod';
import { ProjectIdSchema } from '../identity/project-id';
import { ProjectSequenceSchema } from '../version/project-sequence';
/**
 * A sync acknowledgment from User to Admin.
 *
 * Sent after the User has applied a batch of events. The Admin uses
 * this to advance the per-user delivery record.
 */
export const SyncAckSchema = z.object({
    projectId: ProjectIdSchema,
    ackedThroughSequence: ProjectSequenceSchema,
    appliedEventIds: z.array(z.string()),
    skippedEventIds: z.array(z.string()).default([]),
    failedEventIds: z.array(z.string()).default([]),
    ackedAt: z.string().datetime(),
});
//# sourceMappingURL=ack.js.map