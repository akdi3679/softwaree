export type SyncErrorCode =
  | 'PROTOCOL_VERSION_UNSUPPORTED'
  | 'INVALID_SIGNATURE'
  | 'NOT_AUTHORIZED'
  | 'PROJECT_SUSPENDED'
  | 'RATE_LIMITED'
  | 'INTERNAL'
  | 'INVALID_FRAME';

export interface SyncError {
  type: 'error';
  code: SyncErrorCode;
  message: string;
  retryable: boolean;
}

export const RETRYABLE_ERRORS: ReadonlySet<SyncErrorCode> = new Set([
  'RATE_LIMITED',
  'INTERNAL',
  'PROJECT_SUSPENDED',
]);

export const FATAL_ERRORS: ReadonlySet<SyncErrorCode> = new Set([
  'PROTOCOL_VERSION_UNSUPPORTED',
  'INVALID_SIGNATURE',
  'NOT_AUTHORIZED',
  'INVALID_FRAME',
]);

export function isRetryable(code: SyncErrorCode): boolean {
  return RETRYABLE_ERRORS.has(code);
}

export function isFatal(code: SyncErrorCode): boolean {
  return FATAL_ERRORS.has(code);
}

export function backoffFor(attempt: number): number {
  const base = 1000;
  const max = 60_000;
  return Math.min(max, base * Math.pow(2, attempt));
}
