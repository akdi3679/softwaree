import { z } from 'zod';
/**
 * A subscription plan.
 *
 * The Cloud has 4 built-in plans. Plans are immutable once created;
 * changing a plan is a new plan record.
 *
 * `entitlements` describes what the plan allows.
 */
export declare const PlanTier: {
    readonly LOCAL: "local";
    readonly STARTER: "starter";
    readonly TEAM: "team";
    readonly ENTERPRISE: "enterprise";
};
export type PlanTier = (typeof PlanTier)[keyof typeof PlanTier];
export declare const PlanEntitlementsSchema: z.ZodObject<{
    maxProjects: z.ZodNumber;
    maxUsersPerProject: z.ZodNumber;
    backupEnabled: z.ZodBoolean;
    backupScheduleCron: z.ZodOptional<z.ZodString>;
    backupStorageBytes: z.ZodNumber;
    manualBackupEnabled: z.ZodBoolean;
    customModulesEnabled: z.ZodBoolean;
    auditRetentionDays: z.ZodNumber;
    multiAdminAllowed: z.ZodBoolean;
    maxDevicesPerUser: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    maxProjects: number;
    maxUsersPerProject: number;
    backupEnabled: boolean;
    backupStorageBytes: number;
    manualBackupEnabled: boolean;
    customModulesEnabled: boolean;
    auditRetentionDays: number;
    multiAdminAllowed: boolean;
    maxDevicesPerUser: number;
    backupScheduleCron?: string | undefined;
}, {
    maxProjects: number;
    maxUsersPerProject: number;
    backupEnabled: boolean;
    backupStorageBytes: number;
    manualBackupEnabled: boolean;
    customModulesEnabled: boolean;
    auditRetentionDays: number;
    multiAdminAllowed: boolean;
    backupScheduleCron?: string | undefined;
    maxDevicesPerUser?: number | undefined;
}>;
export type PlanEntitlements = z.infer<typeof PlanEntitlementsSchema>;
export declare const PlanSchema: z.ZodObject<{
    planId: z.ZodString;
    tier: z.ZodNativeEnum<{
        readonly LOCAL: "local";
        readonly STARTER: "starter";
        readonly TEAM: "team";
        readonly ENTERPRISE: "enterprise";
    }>;
    name: z.ZodString;
    description: z.ZodString;
    pricePerMonthCents: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    entitlements: z.ZodObject<{
        maxProjects: z.ZodNumber;
        maxUsersPerProject: z.ZodNumber;
        backupEnabled: z.ZodBoolean;
        backupScheduleCron: z.ZodOptional<z.ZodString>;
        backupStorageBytes: z.ZodNumber;
        manualBackupEnabled: z.ZodBoolean;
        customModulesEnabled: z.ZodBoolean;
        auditRetentionDays: z.ZodNumber;
        multiAdminAllowed: z.ZodBoolean;
        maxDevicesPerUser: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        maxProjects: number;
        maxUsersPerProject: number;
        backupEnabled: boolean;
        backupStorageBytes: number;
        manualBackupEnabled: boolean;
        customModulesEnabled: boolean;
        auditRetentionDays: number;
        multiAdminAllowed: boolean;
        maxDevicesPerUser: number;
        backupScheduleCron?: string | undefined;
    }, {
        maxProjects: number;
        maxUsersPerProject: number;
        backupEnabled: boolean;
        backupStorageBytes: number;
        manualBackupEnabled: boolean;
        customModulesEnabled: boolean;
        auditRetentionDays: number;
        multiAdminAllowed: boolean;
        backupScheduleCron?: string | undefined;
        maxDevicesPerUser?: number | undefined;
    }>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodBranded<z.ZodDate, "Timestamp">;
    deprecatedAt: z.ZodOptional<z.ZodBranded<z.ZodDate, "Timestamp">>;
}, "strip", z.ZodTypeAny, {
    createdAt: Date & z.BRAND<"Timestamp">;
    name: string;
    description: string;
    planId: string;
    tier: "local" | "starter" | "team" | "enterprise";
    pricePerMonthCents: number;
    currency: string;
    entitlements: {
        maxProjects: number;
        maxUsersPerProject: number;
        backupEnabled: boolean;
        backupStorageBytes: number;
        manualBackupEnabled: boolean;
        customModulesEnabled: boolean;
        auditRetentionDays: number;
        multiAdminAllowed: boolean;
        maxDevicesPerUser: number;
        backupScheduleCron?: string | undefined;
    };
    isActive: boolean;
    deprecatedAt?: (Date & z.BRAND<"Timestamp">) | undefined;
}, {
    createdAt: Date;
    name: string;
    description: string;
    planId: string;
    tier: "local" | "starter" | "team" | "enterprise";
    pricePerMonthCents: number;
    entitlements: {
        maxProjects: number;
        maxUsersPerProject: number;
        backupEnabled: boolean;
        backupStorageBytes: number;
        manualBackupEnabled: boolean;
        customModulesEnabled: boolean;
        auditRetentionDays: number;
        multiAdminAllowed: boolean;
        backupScheduleCron?: string | undefined;
        maxDevicesPerUser?: number | undefined;
    };
    currency?: string | undefined;
    isActive?: boolean | undefined;
    deprecatedAt?: Date | undefined;
}>;
export type Plan = z.infer<typeof PlanSchema>;
//# sourceMappingURL=plan.d.ts.map