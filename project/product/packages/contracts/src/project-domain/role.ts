import { z } from 'zod';
import { ProjectIdSchema } from '../identity/project-id';
import { TimestampSchema } from '../time/timestamp';

/**
 * A named role within a project (e.g., "doctor", "receptionist", "lab_tech").
 *
 * Roles are project-scoped — same name can mean different things in different projects.
 * Built-in roles are seeded by the Admin on project creation.
 * Custom roles are admin-defined.
 */
export const RoleSchema = z.object({
  roleId: z.string().uuid(),
  projectId: ProjectIdSchema,
  name: z.string().min(1).max(64).regex(/^[a-z][a-z0-9_]*$/, 'lowercase, snake_case'),
  displayName: z.string().min(1).max(128),
  isBuiltIn: z.boolean().default(false),
  description: z.string().optional(),
  createdAt: TimestampSchema,
});

export type Role = z.infer<typeof RoleSchema>;

/**
 * A permission is a string like "patient.read", "patient.create",
 * "appointment.update", "lab.result.issue", etc.
 *
 * Format: `<resource>.<action>` or `<module>.<resource>.<action>`.
 */
export const PermissionSchema = z
  .string()
  .regex(
    /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/,
    'Permission must be in format "resource.action" or "module.resource.action"',
  );

export type Permission = z.infer<typeof PermissionSchema>;

/**
 * A role-permission grant.
 */
export const RolePermissionSchema = z.object({
  roleId: z.string().uuid(),
  permission: PermissionSchema,
  scope: z.string().optional(),
  grantedAt: TimestampSchema,
});

export type RolePermission = z.infer<typeof RolePermissionSchema>;
