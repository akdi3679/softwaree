import type { Context, Next } from 'hono';

export async function latencyMetrics(c: Context, next: Next) {
  const start = Date.now();
  await next();
  const elapsed = (Date.now() - start) / 1000;
  const route = c.req.routePath ?? c.req.path;
  console.log(JSON.stringify({ type: 'latency', route, method: c.req.method, status: c.res.status, seconds: elapsed }));
}

export function metricsHandler() {
  return 'metrics';
}
