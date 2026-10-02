import { z } from 'zod';
import { ProjectIdSchema } from '../identity/project-id';
import { ProjectSequenceSchema } from '../version/project-sequence';

/**
 * A batch of events sent from Admin to User during sync.
 */
export const EventBatchSchema = z.object({
  projectId: ProjectIdSchema,
  fromSequence: ProjectSequenceSchema,
  toSequence: ProjectSequenceSchema,
  events: z.array(z.unknown()), // EventEnvelope[]
  hasMore: z.boolean(),
});

export type EventBatch = z.infer<typeof EventBatchSchema>;
