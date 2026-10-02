import { z } from 'zod';
/**
 * Backup lifecycle states.
 *
 *  SCHEDULED ? RUNNING ? SUCCESS | FAILED ? RESTORED
 *
 * - SCHEDULED: backup is queued (user-picked time or manual)
 * - RUNNING: backup is in progress
 * - SUCCESS: backup completed successfully
 * - FAILED: backup failed, may be retried
 * - RESTORED: backup was used for a restore (audit trail)
 */
export declare const BackupState: {
    readonly SCHEDULED: "scheduled";
    readonly RUNNING: "running";
    readonly SUCCESS: "success";
    readonly FAILED: "failed";
    readonly RESTORED: "restored";
};
export type BackupState = (typeof BackupState)[keyof typeof BackupState];
export declare const BackupStateSchema: z.ZodNativeEnum<{
    readonly SCHEDULED: "scheduled";
    readonly RUNNING: "running";
    readonly SUCCESS: "success";
    readonly FAILED: "failed";
    readonly RESTORED: "restored";
}>;
//# sourceMappingURL=backup-state.d.ts.map