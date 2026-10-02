import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { correlationIdMiddleware } from './middleware/correlation-id';
import { errorMiddleware } from './middleware/error';
import { rateLimit } from './middleware/rate-limit';
import { metricsMiddleware } from './middleware/metrics';
import { accessLog } from './middleware/access-log';
import { csrf } from './middleware/csrf';
import { cors } from './middleware/cors';
import { securityHeaders } from "./middleware/security-headers";
import { auditMiddleware } from "./audit/middleware";
import { initTracing, tracingMiddleware } from "./tracing/init";
import { logIngestRoutes } from "./routes/logs";
import { billingRoutes } from "./billing/routes";
import { gdprRoutes } from "./routes/gdpr";
import { marketplaceRoutes } from "./marketplace/routes";
import { supportRoutes } from "./support/search";
import { adminConsoleRoutes } from "./admin/console";
import { portalRoutes } from "./portal";
import { discoveryRoutes } from "./discovery";
import { statusRoutes } from "./status/status";
import { healthCheck, readyCheck } from "./scaling/health";
import { startHeartbeatLoop } from "./scaling/heartbeat-loop";
import { latencyMetrics } from './metrics/latency';
import authRoutes from './routes/auth';
import deviceRoutes from './routes/devices';
import projectRoutes from './routes/projects';
import membershipRoutes from './routes/memberships';
import moduleRoutes from './routes/modules';
import backupRoutes from './routes/backups';

initTracing();

const app = new Hono();

app.use('*', logger());
app.use('*', correlationIdMiddleware());
app.use('*', tracingMiddleware);
app.use('*', errorMiddleware());
app.use('*', rateLimit({ perAccountPerMin: 1000, perIpPerMin: 600 }));
app.use('*', securityHeaders);
app.use('*', auditMiddleware);
app.use('*', metricsMiddleware());
app.use('*', accessLog);
app.use('*', csrf);
app.use('*', cors);
app.use('*', latencyMetrics);

app.get('/health', async (c) => c.json(await healthCheck()));
app.get('/ready', async (c) => {
  const r = await readyCheck();
  return c.json(r, r.ready ? 200 : 503);
});

app.route('/', authRoutes);
app.route('/', deviceRoutes);
app.route('/', projectRoutes);
app.route('/', membershipRoutes);
app.route('/', moduleRoutes);
app.route('/', backupRoutes);
app.route('/', logIngestRoutes);
app.route('/', billingRoutes);
app.route('/', gdprRoutes);
app.route('/', marketplaceRoutes);
app.route('/', supportRoutes);
app.route('/', adminConsoleRoutes);
app.route('/', portalRoutes);
app.route('/', discoveryRoutes);
app.route('/', statusRoutes);

const port = Number(process.env.PORT ?? 8080);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[api] listening on http://localhost:${info.port}`);
});
