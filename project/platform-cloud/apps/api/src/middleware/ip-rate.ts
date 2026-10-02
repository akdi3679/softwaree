import type { Context, Next } from 'hono';

const memory = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 600;
const WINDOW_MS = 60_000;

export async function ipRateLimit(c: Context, next: Next) {
  const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? '0.0.0.0';
  const now = Date.now();
  const cur = memory.get(ip);
  if (!cur || cur.resetAt < now) {
    memory.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    await next();
    return;
  }
  if (cur.count >= LIMIT) {
    return c.json({ error: { category: 'rate_limited', message: 'IP rate limit exceeded' } }, 429);
  }
  cur.count++;
  await next();
}
