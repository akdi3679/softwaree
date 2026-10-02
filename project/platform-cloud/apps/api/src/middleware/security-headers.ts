import type { Context, Next } from 'hono';

export async function securityHeaders(c: Context, next: Next) {
  await next();
  c.header('strict-transport-security', 'max-age=31536000; includeSubDomains');
  c.header('x-content-type-options', 'nosniff');
  c.header('x-frame-options', 'DENY');
  c.header('referrer-policy', 'no-referrer');
  c.header('permissions-policy', 'interest-cohort=()');
  c.header('content-security-policy', "default-src 'self'; frame-ancestors 'none'");
  c.header('server', 'product-cloud');
}
