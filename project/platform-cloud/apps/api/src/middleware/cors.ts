import type { Context, Next } from 'hono';

const ALLOWED = (process.env.CORS_ALLOWED ?? 'https://portal.example.com,https://admin-ui.example.com,http://localhost:1420,http://localhost:8787')
  .split(',')
  .map((s) => s.trim());

export async function cors(c: Context, next: Next) {
  const origin = c.req.header('origin');
  if (origin && ALLOWED.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key');
    c.header('Access-Control-Allow-Credentials', 'true');
    c.header('Vary', 'Origin');
  }
  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204);
  }
  await next();
}
