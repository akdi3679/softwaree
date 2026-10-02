import type { Context, Next } from 'hono';
import { randomUUID } from 'node:crypto';

export async function accessLog(c: Context, next: Next) {
  const start = Date.now();
  const requestId = randomUUID();
  c.set('requestId', requestId);
  await next();
  const elapsed = Date.now() - start;
  console.log(JSON.stringify({
    type: 'access',
    requestId,
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    latencyMs: elapsed,
    ip: c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? null,
    userAgent: c.req.header('user-agent') ?? null,
  }));
}
