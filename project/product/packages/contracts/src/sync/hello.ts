import { z } from 'zod';
import { ProjectIdSchema } from '../identity/project-id';
import { UserIdSchema } from '../identity/user-id';
import { DeviceIdSchema } from '../identity/device-id';
import { SessionIdSchema } from '../identity/session-id';
import { ProjectSequenceSchema } from '../version/project-sequence';
import { SchemaVersionSchema } from '../version/schema-version';

/**
 * The opening message of a sync session. Sent by User to Admin.
 *
 * Includes the User's identity, its last known cursor, and the
 * schemas it understands. The Admin responds with what it can serve.
 */
export const SyncHelloSchema = z.object({
  protocolVersion: z.literal(1),
  projectId: ProjectIdSchema,
  userId: UserIdSchema,
  deviceId: DeviceIdSchema,
  sessionId: SessionIdSchema,
  lastAppliedSequence: ProjectSequenceSchema,
  schemaVersion: SchemaVersionSchema,
  projectionFormatVersion: z.number().int().min(1),
  clientCapabilities: z.array(z.string()).default([]),
});

export type SyncHello = z.infer<typeof SyncHelloSchema>;
