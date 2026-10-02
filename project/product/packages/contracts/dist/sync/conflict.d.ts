import { z } from 'zod';
/**
 * A sync conflict: the Admin's state is behind or ahead of what the
 * User expected. This is used to force a snapshot recovery.
 */
export declare const SyncConflictSchema: z.ZodObject<{
    projectId: z.ZodString;
    expectedSequence: z.ZodBranded<z.ZodBigInt, "ProjectSequence">;
    actualSequence: z.ZodBranded<z.ZodBigInt, "ProjectSequence">;
    reason: z.ZodString;
    recoveryHint: z.ZodEnum<["snapshot", "retry", "full_reset"]>;
}, "strip", z.ZodTypeAny, {
    projectId: string;
    reason: string;
    expectedSequence: bigint & z.BRAND<"ProjectSequence">;
    actualSequence: bigint & z.BRAND<"ProjectSequence">;
    recoveryHint: "snapshot" | "retry" | "full_reset";
}, {
    projectId: string;
    reason: string;
    expectedSequence: bigint;
    actualSequence: bigint;
    recoveryHint: "snapshot" | "retry" | "full_reset";
}>;
export type SyncConflict = z.infer<typeof SyncConflictSchema>;
//# sourceMappingURL=conflict.d.ts.map