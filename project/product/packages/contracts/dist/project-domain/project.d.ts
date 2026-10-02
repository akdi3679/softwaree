import { z } from 'zod';
/**
 * A project in the Cloud.
 *
 * Each project has:
 *  - one owner (account)
 *  - one Admin device (current, can be replaced)
 *  - one plan
 *  - N memberships
 *  - one business_type (e.g., "medical", "food-lab", future)
 */
export declare const BusinessType: {
    readonly MEDICAL_RECEPTION: "medical_reception";
    readonly FOOD_LAB: "food_lab";
    readonly OTHER: "other";
};
export type BusinessType = (typeof BusinessType)[keyof typeof BusinessType];
export declare const ProjectSchema: z.ZodObject<{
    projectId: z.ZodBranded<z.ZodString, "ProjectId">;
    ownerUserId: z.ZodBranded<z.ZodString, "UserId">;
    name: z.ZodString;
    businessType: z.ZodNativeEnum<{
        readonly MEDICAL_RECEPTION: "medical_reception";
        readonly FOOD_LAB: "food_lab";
        readonly OTHER: "other";
    }>;
    planId: z.ZodString;
    state: z.ZodNativeEnum<{
        readonly CREATING: "creating";
        readonly ACTIVE: "active";
        readonly SUSPENDED: "suspended";
        readonly ARCHIVED: "archived";
    }>;
    currentAdminDeviceId: z.ZodOptional<z.ZodBranded<z.ZodString, "DeviceId">>;
    createdAt: z.ZodBranded<z.ZodDate, "Timestamp">;
    activatedAt: z.ZodOptional<z.ZodBranded<z.ZodDate, "Timestamp">>;
    suspendedAt: z.ZodOptional<z.ZodBranded<z.ZodDate, "Timestamp">>;
    archivedAt: z.ZodOptional<z.ZodBranded<z.ZodDate, "Timestamp">>;
    archivedRetentionUntil: z.ZodOptional<z.ZodBranded<z.ZodDate, "Timestamp">>;
}, "strip", z.ZodTypeAny, {
    projectId: string & z.BRAND<"ProjectId">;
    createdAt: Date & z.BRAND<"Timestamp">;
    ownerUserId: string & z.BRAND<"UserId">;
    state: "active" | "suspended" | "creating" | "archived";
    name: string;
    planId: string;
    businessType: "medical_reception" | "food_lab" | "other";
    currentAdminDeviceId?: (string & z.BRAND<"DeviceId">) | undefined;
    activatedAt?: (Date & z.BRAND<"Timestamp">) | undefined;
    suspendedAt?: (Date & z.BRAND<"Timestamp">) | undefined;
    archivedAt?: (Date & z.BRAND<"Timestamp">) | undefined;
    archivedRetentionUntil?: (Date & z.BRAND<"Timestamp">) | undefined;
}, {
    projectId: string;
    createdAt: Date;
    ownerUserId: string;
    state: "active" | "suspended" | "creating" | "archived";
    name: string;
    planId: string;
    businessType: "medical_reception" | "food_lab" | "other";
    currentAdminDeviceId?: string | undefined;
    activatedAt?: Date | undefined;
    suspendedAt?: Date | undefined;
    archivedAt?: Date | undefined;
    archivedRetentionUntil?: Date | undefined;
}>;
export type Project = z.infer<typeof ProjectSchema>;
//# sourceMappingURL=project.d.ts.map