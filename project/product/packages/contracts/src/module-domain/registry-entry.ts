import { z } from 'zod';
import { ProjectIdSchema } from '../identity/project-id';
import { UserIdSchema } from '../identity/user-id';
import { DeviceIdSchema } from '../identity/device-id';
import { ModuleStateSchema } from '../domain/module-state';
import { TimestampSchema } from '../time/timestamp';

/**
 * A module's installation record within a project.
 *
 * The Admin keeps one of these per (project, module_id).
 * Tied to a specific version — upgrading creates a new entry.
 */
export const ModuleRegistryEntrySchema = z.object({
  entryId: z.string().uuid(),
  projectId: ProjectIdSchema,
  moduleId: z.string(),
  version: z.string(),
  state: ModuleStateSchema,
  installedAt: TimestampSchema,
  installedByUserId: UserIdSchema,
  installedByDeviceId: DeviceIdSchema,
  binaryPath: z.string(),
  schemaVersion: z.number().int().min(1),
  licenseExpiresAt: TimestampSchema.optional(),
  lastVerifiedAt: TimestampSchema.optional(),
});

export type ModuleRegistryEntry = z.infer<typeof ModuleRegistryEntrySchema>;
