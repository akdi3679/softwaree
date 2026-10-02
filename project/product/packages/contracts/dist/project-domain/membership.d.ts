import { z } from 'zod';
/**
 * A user's membership in a project.
 *
 * Note: `currentRole` is the user's CURRENT role. The Admin can change this.
 * Permission grants are computed from the role at evaluation time.
 */
export declare const MembershipSchema: z.ZodObject<{
    membershipId: z.ZodString;
    projectId: z.ZodBranded<z.ZodString, "ProjectId">;
    userId: z.ZodBranded<z.ZodString, "UserId">;
    currentRole: z.ZodString;
    state: z.ZodNativeEnum<{
        readonly PENDING_INVITATION: "pending_invitation";
        readonly PENDING_APPROVAL: "pending_approval";
        readonly ACTIVE: "active";
        readonly SUSPENDED: "suspended";
        readonly REMOVED: "removed";
    }>;
    joinedAt: z.ZodBranded<z.ZodDate, "Timestamp">;
    approvedAt: z.ZodOptional<z.ZodBranded<z.ZodDate, "Timestamp">>;
    approvedByUserId: z.ZodOptional<z.ZodBranded<z.ZodString, "UserId">>;
    removedAt: z.ZodOptional<z.ZodBranded<z.ZodDate, "Timestamp">>;
    removedByUserId: z.ZodOptional<z.ZodBranded<z.ZodString, "UserId">>;
    removedReason: z.ZodOptional<z.ZodString>;
    maxDevices: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    projectId: string & z.BRAND<"ProjectId">;
    userId: string & z.BRAND<"UserId">;
    state: "active" | "suspended" | "pending_invitation" | "pending_approval" | "removed";
    membershipId: string;
    currentRole: string;
    joinedAt: Date & z.BRAND<"Timestamp">;
    maxDevices: number;
    approvedAt?: (Date & z.BRAND<"Timestamp">) | undefined;
    approvedByUserId?: (string & z.BRAND<"UserId">) | undefined;
    removedAt?: (Date & z.BRAND<"Timestamp">) | undefined;
    removedByUserId?: (string & z.BRAND<"UserId">) | undefined;
    removedReason?: string | undefined;
}, {
    projectId: string;
    userId: string;
    state: "active" | "suspended" | "pending_invitation" | "pending_approval" | "removed";
    membershipId: string;
    currentRole: string;
    joinedAt: Date;
    approvedAt?: Date | undefined;
    approvedByUserId?: string | undefined;
    removedAt?: Date | undefined;
    removedByUserId?: string | undefined;
    removedReason?: string | undefined;
    maxDevices?: number | undefined;
}>;
export type Membership = z.infer<typeof MembershipSchema>;
//# sourceMappingURL=membership.d.ts.map