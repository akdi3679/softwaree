import { Hono } from 'hono';
import { sql } from 'drizzle-orm';
import { db } from '../db/client';

const router = new Hono();

const STARTED_AT = Date.now();

/**
 * GET /v1/status/public
 *
 * Public, unauthenticated status page feed. Never returns PII, never
 * returns internal cluster topology. Safe to expose to the marketing
 * status page (which polls it every 60s).
 */
router.get('/v1/status/public', async (c) => {
  let dbOk = false;
  try {
    await db.execute(sql`SELECT 1`);
    dbOk = true;
  } catch {
    dbOk = false;
  }

  return c.json({
    status: dbOk ? 'ok' : 'degraded',
    version: process.env.APP_VERSION ?? '1.0.0',
    uptime_seconds: Math.floor((Date.now() - STARTED_AT) / 1000),
    regions: ['us'],
    services: {
      api: 'ok',
      db: dbOk ? 'ok' : 'down',
      loki: process.env.LOKI_URL ? 'configured' : 'disabled',
      warehouse:
        process.env.WAREHOUSE_ENABLED === 'true' ? 'configured' : 'disabled',
    },
    checked_at: new Date().toISOString(),
  });
});

export const statusRoutes = router;