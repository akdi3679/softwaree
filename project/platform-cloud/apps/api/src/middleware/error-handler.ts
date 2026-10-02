import type { ErrorHandler } from 'hono';

export const errorHandler: ErrorHandler = (err, c) => {
  const requestId = c.get('requestId') ?? crypto.randomUUID();
  console.error(JSON.stringify({ type: 'error', requestId, error: err.message, stack: err.stack }));
  const status = mapErrorToStatus(err);
  return c.json({
    error: {
      category: mapErrorToCategory(err),
      message: err.message ?? 'internal server error',
      requestId,
      details: process.env.NODE_ENV === 'production' ? undefined : { stack: err.stack },
    },
  }, status as any);
};

function mapErrorToStatus(err: any): number {
  if (err.status) return err.status;
  if (err.name === 'ZodError') return 422;
  if (err.message?.startsWith('not found')) return 404;
  if (err.message?.startsWith('forbidden')) return 403;
  if (err.message?.startsWith('unauthorized')) return 401;
  return 500;
}
function mapErrorToCategory(err: any): string {
  if (err.name === 'ZodError') return 'validation';
  if (err.status === 404) return 'not_found';
  if (err.status === 403) return 'forbidden';
  if (err.status === 401) return 'auth';
  if (err.status === 429) return 'rate_limited';
  return 'internal';
}
