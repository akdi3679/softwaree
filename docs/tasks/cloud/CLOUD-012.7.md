# TASK ID: CLOUD-012.7
# TITLE: Wire all routes into the app
# STATUS: pending
# DEPENDENCIES: CLOUD-012.6
# ALLOWED FILES: platform-cloud/apps/api/src/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 2 minutes

## OBJECTIVE
Mount all route modules under /v1.

## REQUIRED IMPLEMENTATION

Replace `platform-cloud/apps/api/src/index.ts` with:

```typescript
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { correlationIdMiddleware } from './middleware/correlation-id';
import { errorMiddleware } from './middleware/error';
import authRoutes from './routes/auth';
import deviceRoutes from './routes/devices';
import projectRoutes from './routes/projects';
import membershipRoutes from './routes/memberships';
import moduleRoutes from './routes/modules';
import backupRoutes from './routes/backups';

const app = new Hono();

app.use('*', logger());
app.use('*', correlationIdMiddleware());
app.use('*', errorMiddleware());

app.get('/health', (c) => c.json({ status: 'ok' }));

// Mount all v1 routes
app.route('/', authRoutes);
app.route('/', deviceRoutes);
app.route('/', projectRoutes);
app.route('/', membershipRoutes);
app.route('/', moduleRoutes);
app.route('/', backupRoutes);

const port = Number(process.env.PORT ?? 8080);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[api] listening on http://localhost:${info.port}`);
});
```

## TESTS

```bash
cd platform-cloud
grep -q "authRoutes" apps/api/src/index.ts || { echo "FAIL: auth not mounted"; exit 1; }
grep -q "deviceRoutes" apps/api/src/index.ts || { echo "FAIL: device not mounted"; exit 1; }
grep -q "projectRoutes" apps/api/src/index.ts || { echo "FAIL: project not mounted"; exit 1; }
grep -q "membershipRoutes" apps/api/src/index.ts || { echo "FAIL: membership not mounted"; exit 1; }
grep -q "moduleRoutes" apps/api/src/index.ts || { echo "FAIL: module not mounted"; exit 1; }
grep -q "backupRoutes" apps/api/src/index.ts || { echo "FAIL: backup not mounted"; exit 1; }
pnpm --filter @cloud/api typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
