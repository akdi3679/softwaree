import { z } from 'zod';
/**
 * Conflict error: the operation conflicts with the current state.
 *
 * Most common cause: optimistic concurrency � the entity was modified
 * between when the client read it and when the client tried to update.
 * Client should re-fetch and retry.
 *
 * Always category: CONFLICT. Retryable after re-fetch.
 *
 * `code` values:
 *   CONFLICT_VERSION_MISMATCH
 *   CONFLICT_DUPLICATE_KEY
 *   CONFLICT_INVARIANT_VIOLATION
 *   CONFLICT_RESOURCE_LOCKED
 */
export declare const ConflictErrorSchema: z.ZodObject<{
    message: z.ZodString;
    correlationId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodString;
} & {
    category: z.ZodLiteral<"conflict">;
    code: z.ZodString;
    details: z.ZodOptional<z.ZodObject<{
        expectedVersion: z.ZodOptional<z.ZodNumber>;
        actualVersion: z.ZodOptional<z.ZodNumber>;
        conflictingField: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        expectedVersion?: number | undefined;
        actualVersion?: number | undefined;
        conflictingField?: string | undefined;
    }, {
        expectedVersion?: number | undefined;
        actualVersion?: number | undefined;
        conflictingField?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    code: string;
    message: string;
    category: "conflict";
    timestamp: string;
    correlationId?: string | undefined;
    details?: {
        expectedVersion?: number | undefined;
        actualVersion?: number | undefined;
        conflictingField?: string | undefined;
    } | undefined;
}, {
    code: string;
    message: string;
    category: "conflict";
    timestamp: string;
    correlationId?: string | undefined;
    details?: {
        expectedVersion?: number | undefined;
        actualVersion?: number | undefined;
        conflictingField?: string | undefined;
    } | undefined;
}>;
export type ConflictError = z.infer<typeof ConflictErrorSchema>;
//# sourceMappingURL=conflict.d.ts.map