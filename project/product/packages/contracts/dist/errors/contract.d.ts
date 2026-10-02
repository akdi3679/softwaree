import { z } from 'zod';
/**
 * Base shape of every error contract in the platform.
 *
 * Every error that crosses an IPC boundary (Tauri invoke, WebSocket message,
 * HTTP response) uses this shape. Specific error types extend it.
 *
 * - `code`: machine-readable identifier (e.g., 'PROJECT_NOT_FOUND')
 * - `category`: classification for retry/UI decisions
 * - `message`: human-readable, may be localized in future
 * - `details`: optional structured details (key-value)
 * - `correlationId`: traces back to the originating command/query
 * - `timestamp`: when the error occurred
 */
export declare const ErrorContractSchema: z.ZodObject<{
    code: z.ZodString;
    category: z.ZodNativeEnum<{
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
    message: z.ZodString;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    correlationId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    message: string;
    category: "validation" | "authorization" | "not_found" | "conflict" | "rate_limited" | "transient" | "permanent" | "security" | "unavailable";
    timestamp: string;
    correlationId?: string | undefined;
    details?: Record<string, unknown> | undefined;
}, {
    code: string;
    message: string;
    category: "validation" | "authorization" | "not_found" | "conflict" | "rate_limited" | "transient" | "permanent" | "security" | "unavailable";
    timestamp: string;
    correlationId?: string | undefined;
    details?: Record<string, unknown> | undefined;
}>;
export type ErrorContract = z.infer<typeof ErrorContractSchema>;
//# sourceMappingURL=contract.d.ts.map