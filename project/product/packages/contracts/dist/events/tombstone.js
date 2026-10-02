import { z } from 'zod';
import { ProjectIdSchema } from '../identity/project-id';
import { ProjectSequenceSchema } from '../version/project-sequence';
/**
 * A tombstone records that an entity was soft-deleted.
 *
 * The User's projection must keep tombstones for a project so that
 * late-arriving events for the deleted entity are rejected (not
 * re-creating the record).
 */
export const TombstoneSchema = z.object({
    projectId: ProjectIdSchema,
    entityType: z.string().min(1).max(128),
    entityId: z.string().min(1).max(128),
    deletedAt: z.string().datetime(),
    deletedBySequence: ProjectSequenceSchema,
    deletedByUserId: z.string().min(1),
    reason: z.string().optional(),
});
//# sourceMappingURL=tombstone.js.map