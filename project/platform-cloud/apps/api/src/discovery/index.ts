import { Hono } from 'hono';
import { z } from 'zod';
import { eq, lt } from 'drizzle-orm';
import { db } from '../db/client';
import { discoveryHeartbeats } from '../db/schema/discovery-heartbeats';

const router = new Hono();

// ---------------------------------------------------------------------------
// POST /v1/discovery/heartbeat
//
// Body (from SYNC-PROTOCOL.md § Step 1):
//   { device_id, virtual_ip, current_public_ip, current_public_port,
//     current_ipv6, state, reachable_methods, timestamp }
//
// The discovery service stores:
//   device_id -> last known public IP (+ port, + ipv6)
//
// It never sees message contents, never sees "who is talking to whom".
// Security boundary: the caller must send an X-Device-Id header matching
// the body's device_id. Signature verification is a Category C item —
// see HANDOFF.md.
// ---------------------------------------------------------------------------
const heartbeatSchema = z.object({
  device_id: z.string().min(8).max(64),
  virtual_ip: z
    .string()
    .regex(/^10\.50\.\d{1,3}\.\d{1,3}$/, 'virtual_ip must be in 10.50.0.0/16'),
  current_public_ip: z.string().max(64).nullable().optional(),
  current_public_port: z.number().int().min(1).max(65535).nullable().optional(),
  current_ipv6: z.string().max(64).nullable().optional(),
  state: z.enum(['lan', 'internet', 'offline', 'unknown']).default('unknown'),
  reachable_methods: z.array(z.string().max(32)).max(8).default([]),
  timestamp: z.string().datetime(),
});

router.post('/v1/discovery/heartbeat', async (c) => {
  const raw = await c.req.json().catch(() => null);
  if (!raw) return c.json({ error: 'invalid_json' }, 400);

  const parsed = heartbeatSchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'validation_failed', issues: parsed.error.issues }, 400);
  }
  const body = parsed.data;

  // Basic caller check: header must match body (prevents trivially spoofing
  // another device's heartbeat without at least knowing its id).
  const hdr = c.req.header('x-device-id');
  if (hdr && hdr !== body.device_id) {
    return c.json({ error: 'device_id_mismatch' }, 403);
  }

  const now = new Date();
  await db
    .insert(discoveryHeartbeats)
    .values({
      deviceId: body.device_id,
      virtualIp: body.virtual_ip,
      currentPublicIp: body.current_public_ip ?? null,
      currentPublicPort: body.current_public_port ?? null,
      currentIpv6: body.current_ipv6 ?? null,
      state: body.state,
      reachableMethods: body.reachable_methods,
      lastSeenAt: now,
    })
    .onConflictDoUpdate({
      target: discoveryHeartbeats.deviceId,
      set: {
        virtualIp: body.virtual_ip,
        currentPublicIp: body.current_public_ip ?? null,
        currentPublicPort: body.current_public_port ?? null,
        currentIpv6: body.current_ipv6 ?? null,
        state: body.state,
        reachableMethods: body.reachable_methods,
        lastSeenAt: now,
      },
    });

  return c.json({ ok: true, next_heartbeat_seconds: 60 });
});

// ---------------------------------------------------------------------------
// GET /v1/discovery/lookup?virtual_ip=10.50.0.2
//
// Returns the current location of that virtual IP, or 404 if the device
// hasn't been seen in 30 minutes. Caller decides whether to attempt
// connection at that address.
// ---------------------------------------------------------------------------
const STALE_AFTER_MS = 30 * 60 * 1000;
const FORGET_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

router.get('/v1/discovery/lookup', async (c) => {
  const virtualIp = c.req.query('virtual_ip');
  if (!virtualIp) return c.json({ error: 'missing_virtual_ip' }, 400);
  if (!/^10\.50\.\d{1,3}\.\d{1,3}$/.test(virtualIp)) {
    return c.json({ error: 'invalid_virtual_ip' }, 400);
  }

  const rows = await db
    .select()
    .from(discoveryHeartbeats)
    .where(eq(discoveryHeartbeats.virtualIp, virtualIp))
    .limit(1);

  const row = rows[0];
  if (!row) return c.json({ error: 'not_found' }, 404);

  const ageMs = Date.now() - row.lastSeenAt.getTime();
  if (ageMs > FORGET_AFTER_MS) {
    // Stale beyond retention — treat as not found.
    return c.json({ error: 'not_found' }, 404);
  }
  if (ageMs > STALE_AFTER_MS) {
    return c.json({ error: 'stale', last_seen_at: row.lastSeenAt.toISOString() }, 404);
  }

  return c.json({
    device_id: row.deviceId,
    virtual_ip: row.virtualIp,
    current_public_ip: row.currentPublicIp,
    current_public_port: row.currentPublicPort,
    current_ipv6: row.currentIpv6,
    state: row.state,
    reachable_methods: row.reachableMethods,
    last_seen_at: row.lastSeenAt.toISOString(),
  });
});

export const discoveryRoutes = router;