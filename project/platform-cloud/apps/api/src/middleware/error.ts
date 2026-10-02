import type { Context, Next } from 'hono';
import { ErrorCategory } from '@product/contracts';
import type { ErrorContract } from '@product/contracts';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly category: (typeof ErrorCategory)[keyof typeof ErrorCategory],
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export function errorMiddleware() {
  return async (c: Context, next: Next) => {
    try {
      await next();
    } catch (err) {
      const timestamp = new Date().toISOString();
      const correlationId = c.get('correlationId') ?? undefined;

      if (err instanceof HttpError) {
        const body: ErrorContract = {
          code: err.code,
          category: err.category,
          message: err.message,
          details: err.details,
          correlationId,
          timestamp,
        };
        return c.json(body, err.status as 400 | 401 | 403 | 404 | 409 | 429 | 500 | 503);
      }

      console.error('[api] unhandled error', err);
      const body: ErrorContract = {
        code: 'INTERNAL_ERROR',
        category: 'permanent',
        message: 'Internal server error',
        correlationId,
        timestamp,
      };
      return c.json(body, 500);
    }
  };
}
