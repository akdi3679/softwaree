import { z } from 'zod';
/**
 * A snapshot of a User's authorized projection.
 *
 * Contains the full data the User is allowed to see, at a given sequence.
 * The User applies this atomically (in a transaction), then continues with deltas.
 *
 * `tables` is keyed by table name (e.g., "patients_projection", "appointments_projection").
 * Each value is the full row set the User can see.
 */
export declare const SnapshotPayloadSchema: z.ZodObject<{
    snapshotId: z.ZodString;
    projectId: z.ZodBranded<z.ZodString, "ProjectId">;
    atSequence: z.ZodBranded<z.ZodBigInt, "ProjectSequence">;
    generatedAt: z.ZodString;
    projectionFormatVersion: z.ZodNumber;
    tables: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodUnknown, "many">>;
    tombstones: z.ZodArray<z.ZodUnknown, "many">;
}, "strip", z.ZodTypeAny, {
    projectId: string & z.BRAND<"ProjectId">;
    projectionFormatVersion: number;
    atSequence: bigint & z.BRAND<"ProjectSequence">;
    snapshotId: string;
    generatedAt: string;
    tables: Record<string, unknown[]>;
    tombstones: unknown[];
}, {
    projectId: string;
    projectionFormatVersion: number;
    atSequence: bigint;
    snapshotId: string;
    generatedAt: string;
    tables: Record<string, unknown[]>;
    tombstones: unknown[];
}>;
export type SnapshotPayload = z.infer<typeof SnapshotPayloadSchema>;
//# sourceMappingURL=snapshot.d.ts.map