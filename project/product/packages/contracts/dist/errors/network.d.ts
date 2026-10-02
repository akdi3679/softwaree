import { z } from 'zod';
/**
 * Network error: transport-level failure.
 *
 * Most common: connection dropped, timeout, DNS failure, our mesh
 * not reachable. Always category: TRANSIENT or UNAVAILABLE. Retryable.
 *
 * `code` values:
 *   NET_CONNECTION_REFUSED
 *   NET_TIMEOUT
 *   NET_DNS_FAILURE
 *   NET_TAILSCALE_DOWN
 *   NET_LAN_UNREACHABLE
 *   NET_PROTOCOL_ERROR
 */
export declare const NetworkErrorSchema: z.ZodObject<{
    message: z.ZodString;
    correlationId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodString;
} & {
    category: z.ZodUnion<[z.ZodLiteral<"transient">, z.ZodLiteral<"unavailable">]>;
    code: z.ZodString;
    details: z.ZodOptional<z.ZodObject<{
        endpoint: z.ZodOptional<z.ZodString>;
        retryAfterMs: z.ZodOptional<z.ZodNumber>;
        attempt: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        endpoint?: string | undefined;
        retryAfterMs?: number | undefined;
        attempt?: number | undefined;
    }, {
        endpoint?: string | undefined;
        retryAfterMs?: number | undefined;
        attempt?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    code: string;
    message: string;
    category: "transient" | "unavailable";
    timestamp: string;
    correlationId?: string | undefined;
    details?: {
        endpoint?: string | undefined;
        retryAfterMs?: number | undefined;
        attempt?: number | undefined;
    } | undefined;
}, {
    code: string;
    message: string;
    category: "transient" | "unavailable";
    timestamp: string;
    correlationId?: string | undefined;
    details?: {
        endpoint?: string | undefined;
        retryAfterMs?: number | undefined;
        attempt?: number | undefined;
    } | undefined;
}>;
export type NetworkError = z.infer<typeof NetworkErrorSchema>;
//# sourceMappingURL=network.d.ts.map