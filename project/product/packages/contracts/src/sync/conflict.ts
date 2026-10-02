import { z } from 'zod';
import { ProjectSequenceSchema } from '../version/project-sequence';

/**
 * A sync conflict: the Admin's state is behind or ahead of what the
 * User expected. This is used to force a snapshot recovery.
 */
export const SyncConflictSchema = z.object({
  projectId: z.string(),
  expectedSequence: ProjectSequenceSchema,
  actualSequence: ProjectSequenceSchema,
  reason: z.string().min(1),
  recoveryHint: z.enum(['snapshot', 'retry', 'full_reset']),
});

export type SyncConflict = z.infer<typeof SyncConflictSchema>;
