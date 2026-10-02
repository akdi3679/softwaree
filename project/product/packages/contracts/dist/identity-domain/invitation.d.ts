import { z } from 'zod';
/**
 * A pending invitation to join a project.
 *
 * The actual auth token is NOT stored � only its hash.
 * When the user accepts with the token, the system re-hashes and compares.
 */
export declare const InvitationSchema: z.ZodObject<{
    invitationId: z.ZodString;
    projectId: z.ZodBranded<z.ZodString, "ProjectId">;
    invitedByUserId: z.ZodBranded<z.ZodString, "UserId">;
    invitedEmail: z.ZodString;
    tokenHash: z.ZodString;
    initialRole: z.ZodString;
    expiresAt: z.ZodString;
    acceptedAt: z.ZodOptional<z.ZodString>;
    acceptedByUserId: z.ZodOptional<z.ZodBranded<z.ZodString, "UserId">>;
    revokedAt: z.ZodOptional<z.ZodString>;
    revokedReason: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    projectId: string & z.BRAND<"ProjectId">;
    createdAt: string;
    invitationId: string;
    invitedByUserId: string & z.BRAND<"UserId">;
    invitedEmail: string;
    tokenHash: string;
    initialRole: string;
    expiresAt: string;
    revokedAt?: string | undefined;
    revokedReason?: string | undefined;
    acceptedAt?: string | undefined;
    acceptedByUserId?: (string & z.BRAND<"UserId">) | undefined;
}, {
    projectId: string;
    createdAt: string;
    invitationId: string;
    invitedByUserId: string;
    invitedEmail: string;
    tokenHash: string;
    initialRole: string;
    expiresAt: string;
    revokedAt?: string | undefined;
    revokedReason?: string | undefined;
    acceptedAt?: string | undefined;
    acceptedByUserId?: string | undefined;
}>;
export type Invitation = z.infer<typeof InvitationSchema>;
//# sourceMappingURL=invitation.d.ts.map