import { z } from 'zod';
/**
 * Categories of errors across the platform.
 *
 * - VALIDATION: bad input (user's fault). Not retryable.
 * - AUTHORIZATION: permission denied. Not retryable.
 * - NOT_FOUND: resource doesn't exist. Not retryable.
 * - CONFLICT: optimistic concurrency failure. Client may retry with fresh state.
 * - RATE_LIMITED: too many requests. Retryable after backoff.
 * - TRANSIENT: temporary failure (network, db blip). Retryable.
 * - PERMANENT: server error that won't fix itself. Not retryable without intervention.
 * - SECURITY: security violation. May trigger device revocation.
 * - UNAVAILABLE: dependency is down. Retryable.
 */
export declare const ErrorCategory: {
    readonly VALIDATION: "validation";
    readonly AUTHORIZATION: "authorization";
    readonly NOT_FOUND: "not_found";
    readonly CONFLICT: "conflict";
    readonly RATE_LIMITED: "rate_limited";
    readonly TRANSIENT: "transient";
    readonly PERMANENT: "permanent";
    readonly SECURITY: "security";
    readonly UNAVAILABLE: "unavailable";
};
export type ErrorCategory = (typeof ErrorCategory)[keyof typeof ErrorCategory];
export declare const ErrorCategorySchema: z.ZodNativeEnum<{
    readonly VALIDATION: "validation";
    readonly AUTHORIZATION: "authorization";
    readonly NOT_FOUND: "not_found";
    readonly CONFLICT: "conflict";
    readonly RATE_LIMITED: "rate_limited";
    readonly TRANSIENT: "transient";
    readonly PERMANENT: "permanent";
    readonly SECURITY: "security";
    readonly UNAVAILABLE: "unavailable";
}>;
//# sourceMappingURL=category.d.ts.map