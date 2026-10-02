import { z } from 'zod';
/**
 * A sync request from User to Admin.
 *
 * User says: "Give me everything since sequence X, in batches of Y,
 * starting at sequence X+1."
 */
export declare const SyncRequestSchema: z.ZodObject<{
    projectId: z.ZodBranded<z.ZodString, "ProjectId">;
    lastAppliedSequence: z.ZodBranded<z.ZodBigInt, "ProjectSequence">;
    maxEvents: z.ZodDefault<z.ZodNumber>;
    requestedProjectionFormatVersion: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    projectId: string & z.BRAND<"ProjectId">;
    lastAppliedSequence: bigint & z.BRAND<"ProjectSequence">;
    maxEvents: number;
    requestedProjectionFormatVersion: number;
}, {
    projectId: string;
    lastAppliedSequence: bigint;
    requestedProjectionFormatVersion: number;
    maxEvents?: number | undefined;
}>;
export type SyncRequest = z.infer<typeof SyncRequestSchema>;
//# sourceMappingURL=request.d.ts.map