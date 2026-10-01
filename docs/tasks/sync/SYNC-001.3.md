# TASK ID: SYNC-001.3
# TITLE: Add sync error code mapping
# STATUS: pending
# DEPENDENCIES: SYNC-001.2
# ALLOWED FILES: product/packages/contracts/src/sync/error-codes.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add TypeScript error codes for the sync protocol — shared between Admin and User.

## REQUIRED IMPLEMENTATION

Create `product/packages/contracts/src/sync/error-codes.ts`:

```typescript
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

export const RETRYABLE_ERRORS: Set<SyncErrorCode> = new Set([
  'RATE_LIMITED',
  'INTERNAL',
  'PROJECT_SUSPENDED',
]);

export const FATAL_ERRORS: Set<SyncErrorCode> = new Set([
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

/** Backoff for retryable errors. Returns milliseconds. */
export function backoffFor(attempt: number): number {
  const base = 1000;
  const max = 60_000;
  return Math.min(max, base * Math.pow(2, attempt));
}
```

Add to `product/packages/contracts/src/sync/index.ts`:

```typescript
export * from './error-codes';
export * from './frames';
```

Create `product/packages/contracts/src/sync/frames.ts`:

```typescript
import { z } from 'zod';
import type { SyncError } from './error-codes';

const WireEventSchema = z.object({
  sequence: z.number().int(),
  event_id: z.string(),
  event_type: z.string(),
  aggregate_type: z.string(),
  aggregate_id: z.string(),
  aggregate_version: z.number().int(),
  actor_user_id: z.string(),
  device_id: z.string(),
  occurred_at: z.string(),
  correlation_id: z.string().nullable().optional(),
  causation_id: z.string().nullable().optional(),
  payload: z.unknown(),
});

export type WireEvent = z.infer<typeof WireEventSchema>;

export const ClientMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('hello'),
    protocol_version: z.literal(1),
    user_id: z.string().regex(/^usr_/),
    device_id: z.string().regex(/^dev_/),
    project_id: z.string().regex(/^proj_/),
    device_pubkey: z.string(),
    device_signature: z.string(),
  }),
  z.object({
    type: z.literal('sync_request'),
    last_sequence: z.number().int().nonnegative(),
    max_events: z.number().int().positive().nullable().optional(),
  }),
  z.object({
    type: z.literal('ack'),
    acked_through_sequence: z.number().int().nonnegative(),
  }),
  z.object({ type: z.literal('heartbeat') }),
]);

export type ClientMessage = z.infer<typeof ClientMessageSchema>;

export const ServerMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('welcome'), session_id: z.string() }),
  z.object({
    type: z.literal('sync_response'),
    mode: z.literal('events'),
    from_sequence: z.number().int(),
    to_sequence: z.number().int(),
    events: z.array(WireEventSchema),
    has_more: z.boolean(),
  }),
  z.object({
    type: z.literal('sync_response'),
    mode: z.literal('snapshot'),
    at_sequence: z.number().int(),
    data: z.record(z.unknown()),
  }),
  z.object({ type: z.literal('event'), event: WireEventSchema }),
  z.object({
    type: z.literal('error'),
    code: z.string(),
    message: z.string(),
    retryable: z.boolean(),
  }),
  z.object({ type: z.literal('heartbeat_ack') }),
]);

export type ServerMessage = z.infer<typeof ServerMessageSchema>;
```

## TESTS

```bash
cd product
test -f packages/contracts/src/sync/error-codes.ts || { echo "FAIL"; exit 1; }
test -f packages/contracts/src/sync/frames.ts || { echo "FAIL: no frames"; exit 1; }
grep -q "PROTOCOL_VERSION_UNSUPPORTED" packages/contracts/src/sync/error-codes.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
