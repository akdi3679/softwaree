import { z } from 'zod';
/**
 * A User's sync position for a project.
 *
 * Tracks the last event sequence the User has applied to its local projection.
 * Also tracks the projection format version so the User knows when a snapshot
 * is needed due to format changes.
 */
export declare const SyncPositionSchema: z.ZodObject<{
    projectId: z.ZodBranded<z.ZodString, "ProjectId">;
    userId: z.ZodBranded<z.ZodString, "UserId">;
    lastAppliedSequence: z.ZodBranded<z.ZodBigInt, "ProjectSequence">;
    projectionFormatVersion: z.ZodNumber;
    schemaVersion: z.ZodBranded<z.ZodString, "SchemaVersion">;
    snapshotAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    projectId: string & z.BRAND<"ProjectId">;
    userId: string & z.BRAND<"UserId">;
    updatedAt: string;
    schemaVersion: string & z.BRAND<"SchemaVersion">;
    lastAppliedSequence: bigint & z.BRAND<"ProjectSequence">;
    projectionFormatVersion: number;
    snapshotAt?: string | undefined;
}, {
    projectId: string;
    userId: string;
    updatedAt: string;
    schemaVersion: string;
    lastAppliedSequence: bigint;
    projectionFormatVersion: number;
    snapshotAt?: string | undefined;
}>;
export type SyncPosition = z.infer<typeof SyncPositionSchema>;
//# sourceMappingURL=position.d.ts.map