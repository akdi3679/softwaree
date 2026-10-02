import type { Context, Next } from 'hono';

export async function csrf(c: Context, next: Next) {
  if (c.req.method === 'GET' || c.req.method === 'HEAD' || c.req.method === 'OPTIONS') {
    await next();
    return;
  }
  const origin = c.req.header('origin');
  const allowed = (process.env.CORS_ALLOWED_ORIGINS ?? 'https://portal.example.com').split(',');
  if (!origin || !allowed.some((o) => o.trim() === origin)) {
    return c.json({ error: { category: 'forbidden', message: 'invalid origin' } }, 403);
  }
  await next();
}
