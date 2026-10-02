import type { Context, Next } from 'hono';
import { httpRequestsTotal, httpRequestDurationSeconds } from '../observability/metrics';

export function metricsMiddleware() {
  return async (c: Context, next: Next) => {
    const start = process.hrtime.bigint();
    await next();
    const duration = Number(process.hrtime.bigint() - start) / 1e9;
    const route = c.req.routePath ?? c.req.path;
    const method = c.req.method;
    const status = String(c.res.status);
    httpRequestsTotal.inc({ method, route, status });
    httpRequestDurationSeconds.observe({ method, route, status }, duration);
  };
}
