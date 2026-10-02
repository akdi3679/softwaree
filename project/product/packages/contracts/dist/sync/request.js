import { z } from 'zod';
import { ProjectIdSchema } from '../identity/project-id';
import { ProjectSequenceSchema } from '../version/project-sequence';
/**
 * A sync request from User to Admin.
 *
 * User says: "Give me everything since sequence X, in batches of Y,
 * starting at sequence X+1."
 */
export const SyncRequestSchema = z.object({
    projectId: ProjectIdSchema,
    lastAppliedSequence: ProjectSequenceSchema,
    maxEvents: z.number().int().min(1).max(1000).default(100),
    requestedProjectionFormatVersion: z.number().int().min(1),
});
//# sourceMappingURL=request.js.map