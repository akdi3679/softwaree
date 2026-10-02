import { z } from 'zod';
import { ErrorContractSchema } from './contract';
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
export const AuthorizationErrorSchema = ErrorContractSchema.extend({
    category: z.literal('authorization'),
    code: z.string().regex(/^AUTH_/, 'must start with AUTH_'),
    details: z
        .object({
        requiredPermission: z.string().optional(),
        currentPermissions: z.array(z.string()).optional(),
    })
        .optional(),
});
//# sourceMappingURL=authorization.js.map