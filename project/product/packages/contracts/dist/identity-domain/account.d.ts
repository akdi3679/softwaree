import { z } from 'zod';
/**
 * A customer account in the Cloud.
 *
 * An account can own multiple projects (Plan 4) and can be the
 * "account owner" for billing. The account's user (UserId) is the
 * first user that registered; this is the "primary" user.
 */
export declare const AccountStatus: {
    readonly ACTIVE: "active";
    readonly SUSPENDED: "suspended";
    readonly DELETED: "deleted";
};
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];
export declare const AccountSchema: z.ZodObject<{
    userId: z.ZodBranded<z.ZodString, "UserId">;
    email: z.ZodString;
    displayName: z.ZodString;
    status: z.ZodNativeEnum<{
        readonly ACTIVE: "active";
        readonly SUSPENDED: "suspended";
        readonly DELETED: "deleted";
    }>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    lastLoginAt: z.ZodOptional<z.ZodString>;
    emailVerifiedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    createdAt: string;
    status: "active" | "suspended" | "deleted";
    userId: string & z.BRAND<"UserId">;
    email: string;
    displayName: string;
    updatedAt: string;
    lastLoginAt?: string | undefined;
    emailVerifiedAt?: string | undefined;
}, {
    createdAt: string;
    status: "active" | "suspended" | "deleted";
    userId: string;
    email: string;
    displayName: string;
    updatedAt: string;
    lastLoginAt?: string | undefined;
    emailVerifiedAt?: string | undefined;
}>;
export type Account = z.infer<typeof AccountSchema>;
//# sourceMappingURL=account.d.ts.map