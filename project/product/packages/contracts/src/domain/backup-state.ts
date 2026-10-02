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
export const BackupState = {
  SCHEDULED: 'scheduled',
  RUNNING: 'running',
  SUCCESS: 'success',
  FAILED: 'failed',
  RESTORED: 'restored',
} as const;

export type BackupState = (typeof BackupState)[keyof typeof BackupState];

export const BackupStateSchema = z.nativeEnum(BackupState);
