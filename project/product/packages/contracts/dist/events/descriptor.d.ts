import type { z } from 'zod';
/**
 * Metadata for a specific event type. Modules and core register events
 * by providing a descriptor.
 */
export interface EventDescriptor<TPayload> {
    readonly eventType: string;
    readonly version: number;
    readonly payloadSchema: z.ZodType<TPayload>;
    readonly aggregateType: string;
    readonly description: string;
    readonly affectsUserProjection: boolean;
}
//# sourceMappingURL=descriptor.d.ts.map