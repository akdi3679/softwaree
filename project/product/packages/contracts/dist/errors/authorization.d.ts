import { z } from 'zod';
/**
 * Authorization error: the actor does not have permission for this operation.
 *
 * Always category: AUTHORIZATION. Not retryable.
 *
 * `code` values include:
 *   AUTH_NOT_AUTHENTICATED
 *   AUTH_SESSION_EXPIRED
 *   AUTH_DEVICE_REVOKED
 *   AUTH_INSUFFICIENT_PERMISSION
 *   AUTH_PROJECT_INACTIVE
 *   AUTH_PLAN_RESTRICTION
 */
export declare const AuthorizationErrorSchema: z.ZodObject<{
    message: z.ZodString;
    correlationId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodString;
} & {
    category: z.ZodLiteral<"authorization">;
    code: z.ZodString;
    details: z.ZodOptional<z.ZodObject<{
        requiredPermission: z.ZodOptional<z.ZodString>;
        currentPermissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        requiredPermission?: string | undefined;
        currentPermissions?: string[] | undefined;
    }, {
        requiredPermission?: string | undefined;
        currentPermissions?: string[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    code: string;
    message: string;
    category: "authorization";
    timestamp: string;
    correlationId?: string | undefined;
    details?: {
        requiredPermission?: string | undefined;
        currentPermissions?: string[] | undefined;
    } | undefined;
}, {
    code: string;
    message: string;
    category: "authorization";
    timestamp: string;
    correlationId?: string | undefined;
    details?: {
        requiredPermission?: string | undefined;
        currentPermissions?: string[] | undefined;
    } | undefined;
}>;
export type AuthorizationError = z.infer<typeof AuthorizationErrorSchema>;
//# sourceMappingURL=authorization.d.ts.map