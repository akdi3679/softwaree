import { z } from 'zod';
/**
 * A project's current subscription to a plan.
 *
 * Plan changes are recorded as new subscription records, with `supersededBy`
 * linking them.
 */
export declare const SubscriptionStatus: {
    readonly ACTIVE: "active";
    readonly CANCELLED: "cancelled";
    readonly EXPIRED: "expired";
};
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];
export declare const PlanSubscriptionSchema: z.ZodObject<{
    subscriptionId: z.ZodString;
    projectId: z.ZodBranded<z.ZodString, "ProjectId">;
    planId: z.ZodString;
    status: z.ZodNativeEnum<{
        readonly ACTIVE: "active";
        readonly CANCELLED: "cancelled";
        readonly EXPIRED: "expired";
    }>;
    startedAt: z.ZodBranded<z.ZodDate, "Timestamp">;
    endedAt: z.ZodOptional<z.ZodBranded<z.ZodDate, "Timestamp">>;
    supersededBy: z.ZodOptional<z.ZodString>;
    currentPeriodStart: z.ZodBranded<z.ZodDate, "Timestamp">;
    currentPeriodEnd: z.ZodBranded<z.ZodDate, "Timestamp">;
    cancelAtPeriodEnd: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    projectId: string & z.BRAND<"ProjectId">;
    status: "active" | "cancelled" | "expired";
    planId: string;
    subscriptionId: string;
    startedAt: Date & z.BRAND<"Timestamp">;
    currentPeriodStart: Date & z.BRAND<"Timestamp">;
    currentPeriodEnd: Date & z.BRAND<"Timestamp">;
    cancelAtPeriodEnd: boolean;
    endedAt?: (Date & z.BRAND<"Timestamp">) | undefined;
    supersededBy?: string | undefined;
}, {
    projectId: string;
    status: "active" | "cancelled" | "expired";
    planId: string;
    subscriptionId: string;
    startedAt: Date;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    endedAt?: Date | undefined;
    supersededBy?: string | undefined;
    cancelAtPeriodEnd?: boolean | undefined;
}>;
export type PlanSubscription = z.infer<typeof PlanSubscriptionSchema>;
//# sourceMappingURL=subscription.d.ts.map