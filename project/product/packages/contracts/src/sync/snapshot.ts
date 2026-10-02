import { z } from 'zod';
import { ProjectIdSchema } from '../identity/project-id';
import { ProjectSequenceSchema } from '../version/project-sequence';

/**
 * A snapshot of a User's authorized projection.
 *
 * Contains the full data the User is allowed to see, at a given sequence.
 * The User applies this atomically (in a transaction), then continues with deltas.
 *
 * `tables` is keyed by table name (e.g., "patients_projection", "appointments_projection").
 * Each value is the full row set the User can see.
 */
export const SnapshotPayloadSchema = z.object({
  snapshotId: z.string().uuid(),
  projectId: ProjectIdSchema,
  atSequence: ProjectSequenceSchema,
  generatedAt: z.string().datetime(),
  projectionFormatVersion: z.number().int().min(1),
  tables: z.record(z.string(), z.array(z.unknown())),
  tombstones: z.array(z.unknown()),
});

export type SnapshotPayload = z.infer<typeof SnapshotPayloadSchema>;
