# TASK ID: CONTRACT-083.1
# TITLE: Add UnitTest framework (test helpers for shared types)
# STATUS: pending
# DEPENDENCIES: USER-005.5
# ALLOWED FILES: product/packages/contracts/src/test-helpers.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Test helpers for shared contracts — random IDs, valid envelopes, etc.

## REQUIRED IMPLEMENTATION

Create `product/packages/contracts/src/test-helpers.ts`:

```typescript
import type { ProjectId, UserId, DeviceId, SessionId, CommandId, EventId } from './ids/branded';
import { toProjectId, toUserId, toDeviceId, toSessionId, toCommandId, toEventId } from './ids/branded';

const ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz';

export function randomString(len: number): string {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export function makeProjectId(): ProjectId {
  return toProjectId(`proj_${randomString(22)}`);
}

export function makeUserId(): UserId {
  return toUserId(`usr_${randomString(22)}`);
}

export function makeDeviceId(): DeviceId {
  return toDeviceId(`dev_${randomString(22)}`);
}

export function makeSessionId(): SessionId {
  return toSessionId(`sess_${randomString(22)}`);
}

export function makeCommandId(): CommandId {
  return toCommandId(`cmd_${randomString(22)}`);
}

export function makeEventId(): EventId {
  return toEventId(`evt_${randomString(22)}`);
}

export function makeCommandEnvelope<T>(commandType: string, payload: T, overrides: Partial<{ correlationId: string; idempotencyKey: string; actorUserId: UserId; deviceId: DeviceId }> = {}) {
  return {
    id: makeCommandId(),
    command_type: commandType,
    payload: payload as any,
    actor_user_id: overrides.actorUserId ?? makeUserId(),
    device_id: overrides.deviceId ?? makeDeviceId(),
    occurred_at: new Date().toISOString(),
    correlation_id: overrides.correlationId ?? null,
    idempotency_key: overrides.idempotencyKey ?? randomString(16),
  };
}

export function makeEventEnvelope<T>(eventType: string, aggregateType: string, aggregateId: string, payload: T) {
  return {
    id: makeEventId(),
    event_type: eventType,
    aggregate_type: aggregateType,
    aggregate_id: aggregateId,
    aggregate_version: 1,
    actor_user_id: makeUserId(),
    device_id: makeDeviceId(),
    occurred_at: new Date().toISOString(),
    correlation_id: null,
    causation_id: null,
    payload: payload as any,
  };
}
```

## TESTS

```bash
cd product
test -f packages/contracts/src/test-helpers.ts || { echo "FAIL"; exit 1; }
grep -q "makeProjectId" packages/contracts/src/test-helpers.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
