import type { z } from 'zod';
/**
 * Metadata for a specific query type. Modules and core register queries
 * by providing a descriptor.
 *
 * Queries are read-only. They do not produce events.
 */
export interface QueryDescriptor<TPayload, TResult> {
    readonly queryType: string;
    readonly version: number;
    readonly payloadSchema: z.ZodType<TPayload>;
    readonly resultSchema: z.ZodType<TResult>;
    readonly requiredPermission: string;
    readonly description: string;
    readonly cacheable: boolean;
    readonly cacheTtlSeconds?: number;
}
//# sourceMappingURL=descriptor.d.ts.map