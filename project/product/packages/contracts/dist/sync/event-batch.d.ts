import { z } from 'zod';
/**
 * A batch of events sent from Admin to User during sync.
 */
export declare const EventBatchSchema: z.ZodObject<{
    projectId: z.ZodBranded<z.ZodString, "ProjectId">;
    fromSequence: z.ZodBranded<z.ZodBigInt, "ProjectSequence">;
    toSequence: z.ZodBranded<z.ZodBigInt, "ProjectSequence">;
    events: z.ZodArray<z.ZodUnknown, "many">;
    hasMore: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    projectId: string & z.BRAND<"ProjectId">;
    hasMore: boolean;
    fromSequence: bigint & z.BRAND<"ProjectSequence">;
    toSequence: bigint & z.BRAND<"ProjectSequence">;
    events: unknown[];
}, {
    projectId: string;
    hasMore: boolean;
    fromSequence: bigint;
    toSequence: bigint;
    events: unknown[];
}>;
export type EventBatch = z.infer<typeof EventBatchSchema>;
//# sourceMappingURL=event-batch.d.ts.map