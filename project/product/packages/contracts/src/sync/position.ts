import { z } from 'zod';
import { ProjectIdSchema } from '../identity/project-id';
import { UserIdSchema } from '../identity/user-id';
import { ProjectSequenceSchema } from '../version/project-sequence';
import { SchemaVersionSchema } from '../version/schema-version';

/**
 * A User's sync position for a project.
 *
 * Tracks the last event sequence the User has applied to its local projection.
 * Also tracks the projection format version so the User knows when a snapshot
 * is needed due to format changes.
 */
export const SyncPositionSchema = z.object({
  projectId: ProjectIdSchema,
  userId: UserIdSchema,
  lastAppliedSequence: ProjectSequenceSchema,
  projectionFormatVersion: z.number().int().min(1),
  schemaVersion: SchemaVersionSchema,
  snapshotAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime(),
});

export type SyncPosition = z.infer<typeof SyncPositionSchema>;
