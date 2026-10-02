import { z } from 'zod';
/**
 * A tombstone records that an entity was soft-deleted.
 *
 * The User's projection must keep tombstones for a project so that
 * late-arriving events for the deleted entity are rejected (not
 * re-creating the record).
 */
export declare const TombstoneSchema: z.ZodObject<{
    projectId: z.ZodBranded<z.ZodString, "ProjectId">;
    entityType: z.ZodString;
    entityId: z.ZodString;
    deletedAt: z.ZodString;
    deletedBySequence: z.ZodBranded<z.ZodBigInt, "ProjectSequence">;
    deletedByUserId: z.ZodString;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    projectId: string & z.BRAND<"ProjectId">;
    entityType: string;
    entityId: string;
    deletedAt: string;
    deletedBySequence: bigint & z.BRAND<"ProjectSequence">;
    deletedByUserId: string;
    reason?: string | undefined;
}, {
    projectId: string;
    entityType: string;
    entityId: string;
    deletedAt: string;
    deletedBySequence: bigint;
    deletedByUserId: string;
    reason?: string | undefined;
}>;
export type Tombstone = z.infer<typeof TombstoneSchema>;
//# sourceMappingURL=tombstone.d.ts.map