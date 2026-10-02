import { Hono } from 'hono';
import { z } from 'zod';
import { uploadBackup, listBackupsForProject } from '../services/backup';
import { HttpError } from '../middleware/error';
import { ErrorCategory } from '@product/contracts';

const router = new Hono();

router.post('/v1/backups', async (c) => {
  const body = z.object({
    projectId: z.string().uuid(),
    sourceDeviceId: z.string().uuid(),
    kind: z.enum(['auto', 'manual']),
    snapshotTakenAt: z.string().datetime(),
    snapshotAtSequence: z.number().int().min(0),
  }).parse({
    projectId: c.req.query('projectId'),
    sourceDeviceId: c.req.query('sourceDeviceId'),
    kind: c.req.query('kind'),
    snapshotTakenAt: c.req.query('snapshotTakenAt'),
    snapshotAtSequence: Number(c.req.query('snapshotAtSequence')),
  });
  const encryptedBlob = Buffer.from(await c.req.arrayBuffer());
  const result = await uploadBackup({
    projectId: body.projectId,
    sourceDeviceId: body.sourceDeviceId,
    kind: body.kind,
    sizeBytes: encryptedBlob.length,
    snapshotTakenAt: new Date(body.snapshotTakenAt),
    snapshotAtSequence: body.snapshotAtSequence,
    encryptedBlob,
  });
  if (!result) {
    throw new HttpError(500, ErrorCategory.PERMANENT, 'BACKUP_UPLOAD_FAILED', 'Failed to upload backup');
  }
  return c.json({ backupId: result.backupId, state: result.state, contentSha256: result.contentSha256 }, 201);
});

router.get('/v1/projects/:projectId/backups', async (c) => {
  const projectId = c.req.param('projectId');
  const backups = await listBackupsForProject(projectId);
  return c.json({ backups });
});

export default router;
