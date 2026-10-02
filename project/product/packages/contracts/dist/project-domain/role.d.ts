import { z } from 'zod';
/**
 * A named role within a project (e.g., "doctor", "receptionist", "lab_tech").
 *
 * Roles are project-scoped � same name can mean different things in different projects.
 * Built-in roles are seeded by the Admin on project creation.
 * Custom roles are admin-defined.
 */
export declare const RoleSchema: z.ZodObject<{
    roleId: z.ZodString;
    projectId: z.ZodBranded<z.ZodString, "ProjectId">;
    name: z.ZodString;
    displayName: z.ZodString;
    isBuiltIn: z.ZodDefault<z.ZodBoolean>;
    description: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodBranded<z.ZodDate, "Timestamp">;
}, "strip", z.ZodTypeAny, {
    projectId: string & z.BRAND<"ProjectId">;
    createdAt: Date & z.BRAND<"Timestamp">;
    displayName: string;
    name: string;
    roleId: string;
    isBuiltIn: boolean;
    description?: string | undefined;
}, {
    projectId: string;
    createdAt: Date;
    displayName: string;
    name: string;
    roleId: string;
    description?: string | undefined;
    isBuiltIn?: boolean | undefined;
}>;
export type Role = z.infer<typeof RoleSchema>;
/**
 * A permission is a string like "patient.read", "patient.create",
 * "appointment.update", "lab.result.issue", etc.
 *
 * Format: `<resource>.<action>` or `<module>.<resource>.<action>`.
 */
export declare const PermissionSchema: z.ZodString;
export type Permission = z.infer<typeof PermissionSchema>;
/**
 * A role-permission grant.
 */
export declare const RolePermissionSchema: z.ZodObject<{
    roleId: z.ZodString;
    permission: z.ZodString;
    scope: z.ZodOptional<z.ZodString>;
    grantedAt: z.ZodBranded<z.ZodDate, "Timestamp">;
}, "strip", z.ZodTypeAny, {
    roleId: string;
    permission: string;
    grantedAt: Date & z.BRAND<"Timestamp">;
    scope?: string | undefined;
}, {
    roleId: string;
    permission: string;
    grantedAt: Date;
    scope?: string | undefined;
}>;
export type RolePermission = z.infer<typeof RolePermissionSchema>;
//# sourceMappingURL=role.d.ts.map