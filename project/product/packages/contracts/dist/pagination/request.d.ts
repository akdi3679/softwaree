import { z } from 'zod';
/**
 * Standard cursor-based pagination request.
 *
 * `cursor` is opaque to the client; the server returns it in the response.
 * `limit` is the max number of items (server may return fewer).
 */
export declare const PaginationRequestSchema: z.ZodObject<{
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    direction: z.ZodDefault<z.ZodEnum<["forward", "backward"]>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    direction: "forward" | "backward";
    cursor?: string | undefined;
}, {
    cursor?: string | undefined;
    limit?: number | undefined;
    direction?: "forward" | "backward" | undefined;
}>;
export type PaginationRequest = z.infer<typeof PaginationRequestSchema>;
//# sourceMappingURL=request.d.ts.map