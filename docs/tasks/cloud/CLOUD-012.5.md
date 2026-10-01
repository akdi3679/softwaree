# TASK ID: CLOUD-012.5
# TITLE: Create module registry routes
# STATUS: pending
# DEPENDENCIES: CLOUD-012.4
# ALLOWED FILES: platform-cloud/apps/api/src/routes/modules.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Create the Hono routes for module listing, version listing, and signed package download.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/apps/api/src/routes/modules.ts`:

```typescript
import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/client';
import { modules, moduleVersions } from '../db/schema';
import { HttpError } from '../middleware/error';
import { ErrorCategory } from '@product/contracts';
import { signModulePackage } from '../services/module-signing';
import { BACKUP_BUCKET, minio } from '../storage/minio';

const router = new Hono();

router.get('/v1/modules', async (c) => {
  const list = await db.select().from(modules).where(eq(modules.isListed, true));
  return c.json({ modules: list });
});

router.get('/v1/modules/:moduleId', async (c) => {
  const moduleId = c.req.param('moduleId');
  const [mod] = await db.select().from(modules).where(eq(modules.moduleId, moduleId)).limit(1);
  if (!mod) {
    throw new HttpError(404, ErrorCategory.NOT_FOUND, 'MODULE_NOT_FOUND', 'Module not found');
  }
  return c.json(mod);
});

router.get('/v1/modules/:moduleId/versions', async (c) => {
  const moduleId = c.req.param('moduleId');
  const [mod] = await db.select().from(modules).where(eq(modules.moduleId, moduleId)).limit(1);
  if (!mod) {
    throw new HttpError(404, ErrorCategory.NOT_FOUND, 'MODULE_NOT_FOUND', 'Module not found');
  }
  const versions = await db
    .select()
    .from(moduleVersions)
    .where(eq(moduleVersions.moduleId, mod.id));
  return c.json({ versions });
});

router.get('/v1/modules/:moduleId/versions/:version/manifest', async (c) => {
  const moduleId = c.req.param('moduleId');
  const version = c.req.param('version');
  const [mod] = await db.select().from(modules).where(eq(modules.moduleId, moduleId)).limit(1);
  if (!mod) {
    throw new HttpError(404, ErrorCategory.NOT_FOUND, 'MODULE_NOT_FOUND', 'Module not found');
  }
  const [v] = await db
    .select()
    .from(moduleVersions)
    .where(and(eq(moduleVersions.moduleId, mod.id), eq(moduleVersions.version, version)))
    .limit(1);
  if (!v) {
    throw new HttpError(404, ErrorCategory.NOT_FOUND, 'MODULE_VERSION_NOT_FOUND', 'Version not found');
  }
  return c.json({ manifest: v.manifest });
});

/**
 * Download the signed package. The Admin must provide:
 *  - projectId (for project_license signature)
 *  - planId (for project_license signature)
 *  - deviceId (for device_bind signature)
 *  - deviceBindKey (HMAC key bound to the device)
 *
 * The Cloud signs the package and returns it.
 */
router.post('/v1/modules/:moduleId/versions/:version/package', async (c) => {
  const moduleId = c.req.param('moduleId');
  const version = c.req.param('version');
  const { projectId, planId, deviceId, deviceBindKey } = z.object({
    projectId: z.string().uuid(),
    planId: z.string().uuid(),
    deviceId: z.string().uuid(),
    deviceBindKey: z.string().min(32).max(256),
  }).parse(await c.req.json());

  // Look up module + version
  const [mod] = await db.select().from(modules).where(eq(modules.moduleId, moduleId)).limit(1);
  if (!mod) {
    throw new HttpError(404, ErrorCategory.NOT_FOUND, 'MODULE_NOT_FOUND', 'Module not found');
  }
  const [v] = await db
    .select()
    .from(moduleVersions)
    .where(and(eq(moduleVersions.moduleId, mod.id), eq(moduleVersions.version, version)))
    .limit(1);
  if (!v) {
    throw new HttpError(404, ErrorCategory.NOT_FOUND, 'MODULE_VERSION_NOT_FOUND', 'Version not found');
  }

  // Download binary from MinIO
  const stream = await minio.getObject(BACKUP_BUCKET, v.packagePath);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  const binary = Buffer.concat(chunks);

  // Sign the package (triple signature)
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

import { z } from 'zod';

export default router;
```

## TESTS

```bash
cd platform-cloud
test -f apps/api/src/routes/modules.ts || { echo "FAIL"; exit 1; }
grep -q "/v1/modules" apps/api/src/routes/modules.ts || { echo "FAIL"; exit 1; }
pnpm --filter @cloud/api typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
