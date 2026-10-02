import type { Context, Next } from 'hono';
import { randomUUID } from 'node:crypto';

const HEADER = 'X-Correlation-Id';

/**
 * Read or generate a correlation ID. Propagated to logs and error responses.
 */
export function correlationIdMiddleware() {
  return async (c: Context, next: Next) => {
    const incoming = c.req.header(HEADER);
    const id = incoming && incoming.length <= 128 ? incoming : randomUUID();
    c.set('correlationId', id);
    c.header(HEADER, id);
    await next();
  };
}
