import { z } from 'zod';
/**
 * A sync acknowledgment from User to Admin.
 *
 * Sent after the User has applied a batch of events. The Admin uses
 * this to advance the per-user delivery record.
 */
export declare const SyncAckSchema: z.ZodObject<{
    projectId: z.ZodBranded<z.ZodString, "ProjectId">;
    ackedThroughSequence: z.ZodBranded<z.ZodBigInt, "ProjectSequence">;
    appliedEventIds: z.ZodArray<z.ZodString, "many">;
    skippedEventIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    failedEventIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    ackedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    projectId: string & z.BRAND<"ProjectId">;
    ackedThroughSequence: bigint & z.BRAND<"ProjectSequence">;
    appliedEventIds: string[];
    skippedEventIds: string[];
    failedEventIds: string[];
    ackedAt: string;
}, {
    projectId: string;
    ackedThroughSequence: bigint;
    appliedEventIds: string[];
    ackedAt: string;
    skippedEventIds?: string[] | undefined;
    failedEventIds?: string[] | undefined;
}>;
export type SyncAck = z.infer<typeof SyncAckSchema>;
//# sourceMappingURL=ack.d.ts.map