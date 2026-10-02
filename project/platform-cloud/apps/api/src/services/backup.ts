import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { backups } from '../db/schema';
import { randomUUID } from 'node:crypto';

export async function uploadBackup(input: {
  projectId: string;
  sourceDeviceId: string;
  kind: 'auto' | 'manual';
  sizeBytes: number;
  snapshotTakenAt: Date;
  snapshotAtSequence: number;
  encryptedBlob: Buffer;
}) {
  // In real implementation, store blob in MinIO and compute sha256
  const contentSha256 = '0'.repeat(64); // placeholder
  const storagePath = `backups/${randomUUID()}`;
  const [row] = await db
    .insert(backups)
    .values({
      projectId: input.projectId,
      sourceDeviceId: input.sourceDeviceId,
      kind: input.kind,
      sizeBytes: input.sizeBytes,
      contentSha256,
      storagePath,
      snapshotTakenAt: input.snapshotTakenAt,
      snapshotAtSequence: input.snapshotAtSequence,
      state: 'uploaded',
    })
    .returning();
  return row;
}

export async function listBackupsForProject(projectId: string) {
  return db.select().from(backups).where(eq(backups.projectId, projectId));
}

export async function downloadBackup(backupId: string) {
  const rows = await db.select().from(backups).where(eq(backups.backupId, backupId)).limit(1);
  const backup = rows[0];
  if (!backup) throw new Error('backup not found');
  // return placeholder stream
  return { backup, stream: null };
}
