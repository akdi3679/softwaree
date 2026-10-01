# TASK ID: CLOUD-012.6
# TITLE: Create backup routes
# STATUS: pending
# DEPENDENCIES: CLOUD-012.5
# ALLOWED FILES: platform-cloud/apps/api/src/routes/backups.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Create the Hono routes for backup upload, list, and download.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/apps/api/src/routes/backups.ts`:

```typescript
import { Hono } from 'hono';
import { z } from 'zod';
import { uploadBackup, listBackupsForProject, downloadBackup } from '../services/backup';
import { appendAudit } from '../services/audit';
import { HttpError } from '../middleware/error';
import { ErrorCategory } from '@product/contracts';

const router = new Hono();

const UploadSchema = z.object({
  projectId: z.string().uuid(),
  sourceDeviceId: z.string().uuid(),
  kind: z.enum(['auto', 'manual']),
  snapshotTakenAt: z.string().datetime(),
  snapshotAtSequence: z.number().int().min(0),
  // The encrypted blob comes in the request body
});

router.post('/v1/backups', async (c) => {
  const body = UploadSchema.parse({
    ...(await c.req.parseBody()),
    projectId: c.req.query('projectId'),
    sourceDeviceId: c.req.query('sourceDeviceId'),
    kind: c.req.query('kind'),
    snapshotTakenAt: c.req.query('snapshotTakenAt'),
    snapshotAtSequence: c.req.query('snapshotAtSequence'),
  });
  const encryptedBlob = Buffer.from(await c.req.arrayBuffer());
  if (encryptedBlob.length === 0) {
    throw new HttpError(400, ErrorCategory.VALIDATION, 'VALIDATION_BLOB_REQUIRED', 'Backup blob required');
  }
  const result = await uploadBackup({
    projectId: body.projectId,
    sourceDeviceId: body.sourceDeviceId,
    kind: body.kind,
    sizeBytes: encryptedBlob.length,
    snapshotTakenAt: new Date(body.snapshotTakenAt),
    snapshotAtSequence: body.snapshotAtSequence,
    encryptedBlob,
  });
  await appendAudit({
    category: 'platform',
    action: 'backup.triggered',
    actorDeviceId: body.sourceDeviceId,
    projectId: body.projectId,
    result: 'success',
    details: { backupId: result.backupId, kind: body.kind, sizeBytes: encryptedBlob.length },
  });
  return c.json({
    backupId: result.backupId,
    state: result.state,
    contentSha256: result.contentSha256,
  }, 201);
});

router.get('/v1/projects/:projectId/backups', async (c) => {
  const projectId = c.req.param('projectId');
  const list = await listBackupsForProject(projectId);
  return c.json({ backups: list });
});

router.get('/v1/backups/:backupId', async (c) => {
  const backupId = c.req.param('backupId');
  const { backup, stream } = await downloadBackup(backupId);
  // Stream the encrypted blob back
  c.header('Content-Type', 'application/octet-stream');
  c.header('X-Backup-Sha256', backup.contentSha256);
  return c.body(stream as any);
});

export default router;
```

## TESTS

```bash
cd platform-cloud
test -f apps/api/src/routes/backups.ts || { echo "FAIL"; exit 1; }
pnpm --filter @cloud/api typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
