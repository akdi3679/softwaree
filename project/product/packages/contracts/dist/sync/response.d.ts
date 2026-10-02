import { z } from 'zod';
/**
 * A sync response from Admin to User.
 *
 * The Admin either sends:
 *  - mode: 'events', with a batch of events
 *  - mode: 'snapshot', with a full projection snapshot
 *
 * The User inspects the mode and applies accordingly.
 */
export declare const SyncResponseSchema: z.ZodDiscriminatedUnion<"mode", [z.ZodObject<{
    mode: z.ZodLiteral<"events">;
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
    mode: "events";
}, {
    projectId: string;
    hasMore: boolean;
    fromSequence: bigint;
    toSequence: bigint;
    events: unknown[];
    mode: "events";
}>, z.ZodObject<{
    mode: z.ZodLiteral<"snapshot">;
    projectId: z.ZodBranded<z.ZodString, "ProjectId">;
    atSequence: z.ZodBranded<z.ZodBigInt, "ProjectSequence">;
    snapshot: z.ZodUnknown;
    projectionFormatVersion: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    projectId: string & z.BRAND<"ProjectId">;
    projectionFormatVersion: number;
    mode: "snapshot";
    atSequence: bigint & z.BRAND<"ProjectSequence">;
    snapshot?: unknown;
}, {
    projectId: string;
    projectionFormatVersion: number;
    mode: "snapshot";
    atSequence: bigint;
    snapshot?: unknown;
}>]>;
export type SyncResponse = z.infer<typeof SyncResponseSchema>;
//# sourceMappingURL=response.d.ts.map