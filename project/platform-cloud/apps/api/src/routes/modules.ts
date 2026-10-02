import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/client';
import { modules, moduleVersions } from '../db/schema';
import { HttpError } from '../middleware/error';
import { ErrorCategory } from '@product/contracts';
import { signModulePackage } from '../services/module-signing';
import { minio, BACKUP_BUCKET } from '../storage/minio';

const router = new Hono();

router.get('/v1/modules', async (c) => {
  const list = await db.select().from(modules);
  return c.json({ modules: list });
});

router.get('/v1/modules/:moduleId/versions', async (c) => {
  const moduleId = c.req.param('moduleId');
  const [mod] = await db.select().from(modules).where(eq(modules.moduleId, moduleId)).limit(1);
  if (!mod) throw new HttpError(404, ErrorCategory.NOT_FOUND, 'MODULE_NOT_FOUND', 'Module not found');
  const versions = await db.select().from(moduleVersions).where(eq(moduleVersions.moduleId, mod.id));
  return c.json({ versions });
});

router.get('/v1/modules/:moduleId/versions/:version/manifest', async (c) => {
  const moduleId = c.req.param('moduleId');
  const version = c.req.param('version');
  const [mod] = await db.select().from(modules).where(eq(modules.moduleId, moduleId)).limit(1);
  if (!mod) throw new HttpError(404, ErrorCategory.NOT_FOUND, 'MODULE_NOT_FOUND', 'Module not found');
  const [v] = await db.select().from(moduleVersions).where(and(eq(moduleVersions.moduleId, mod.id), eq(moduleVersions.version, version))).limit(1);
  if (!v) throw new HttpError(404, ErrorCategory.NOT_FOUND, 'MODULE_VERSION_NOT_FOUND', 'Version not found');
  return c.json({ manifest: v.manifest });
});

router.post('/v1/modules/:moduleId/versions/:version/package', async (c) => {
  const moduleId = c.req.param('moduleId');
  const version = c.req.param('version');
  const { projectId, planId, deviceId, deviceBindKey } = z.object({
    projectId: z.string().uuid(),
    planId: z.string().uuid(),
    deviceId: z.string().uuid(),
    deviceBindKey: z.string().min(32).max(256),
  }).parse(await c.req.json());

  const [mod] = await db.select().from(modules).where(eq(modules.moduleId, moduleId)).limit(1);
  if (!mod) throw new HttpError(404, ErrorCategory.NOT_FOUND, 'MODULE_NOT_FOUND', 'Module not found');
  const [v] = await db.select().from(moduleVersions).where(and(eq(moduleVersions.moduleId, mod.id), eq(moduleVersions.version, version))).limit(1);
  if (!v) throw new HttpError(404, ErrorCategory.NOT_FOUND, 'MODULE_VERSION_NOT_FOUND', 'Version not found');

  // Placeholder: fetch binary from MinIO (empty for now)
  const chunks: Buffer[] = [];
  const stream = await minio.getObject(BACKUP_BUCKET, v.packagePath);
  const reader = (stream as any).getReader?.();
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
    }
  }
  const binary = Buffer.concat(chunks);

  const signatures = await signModulePackage({
    manifest: v.manifest,
    binary,
    projectId,
    planId,
    deviceId,
    deviceBindKey,
  });

  return c.json({
    manifest: v.manifest,
    binary: binary.toString('base64'),
    signatures,
    packagingFormatVersion: 1,
  });
});

export default router;
