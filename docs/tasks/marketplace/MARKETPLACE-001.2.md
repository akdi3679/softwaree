# TASK ID: MARKETPLACE-001.2
# TITLE: Add marketplace public routes (browse, install)
# STATUS: pending
# DEPENDENCIES: MARKETPLACE-001.1
# ALLOWED FILES: platform-cloud/src/marketplace/routes.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add public marketplace API: list approved modules, get module details.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/marketplace/routes.ts`:

```typescript
import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db';
import { modules, moduleVersions } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const marketplaceRoutes = new Hono()
  .get('/v1/marketplace/modules', async (c) => {
    const category = c.req.query('category');
    const search = c.req.query('q');
    // Only return published modules
    const where: any[] = [eq(modules.reviewStatus, 'published')];
    if (category) where.push(eq(modules.category, category));
    if (search) where.push(/* LIKE on name+description */ undefined);
    const rows = await db.select().from(modules).where(and(...where)).orderBy(desc(modules.publishedAt));
    return c.json({ modules: rows });
  })
  .get('/v1/marketplace/modules/:id', async (c) => {
    const id = c.req.param('id');
    const rows = await db.select().from(modules).where(eq(modules.moduleId, id)).limit(1);
    if (rows.length === 0) return c.json({ error: 'not_found' }, 404);
    const versions = await db.select().from(moduleVersions)
      .where(and(eq(moduleVersions.moduleId, id), eq(moduleVersions.reviewStatus, 'published')))
      .orderBy(desc(moduleVersions.publishedAt));
    return c.json({ module: rows[0], versions });
  })
  .get('/v1/marketplace/modules/:id/versions/:v/install', async (c) => {
    const { id, v } = c.req.param();
    const projectId = c.req.query('project_id');
    const deviceId = c.req.query('device_id');
    if (!projectId || !deviceId) {
      return c.json({ error: 'project_id and device_id required' }, 400);
    }
    // Verify the requesting account owns this project
    // (omitted for brevity; in real code: check membership)
    // Generate a signed package with project_license
    const rows = await db.select().from(moduleVersions)
      .where(and(eq(moduleVersions.moduleId, id), eq(moduleVersions.version, v))).limit(1);
    if (rows.length === 0) return c.json({ error: 'not_found' }, 404);
    return c.json({
      manifest: JSON.parse(rows[0].manifestJson),
      binary: rows[0].binary,
      signatures: JSON.parse(rows[0].signatures),
    });
  });
```

## TESTS

```bash
cd platform-cloud
test -f src/marketplace/routes.ts || { echo "FAIL"; exit 1; }
grep -q "v1/marketplace/modules" src/marketplace/routes.ts || { echo "FAIL: no route"; exit 1; }
pnpm typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
