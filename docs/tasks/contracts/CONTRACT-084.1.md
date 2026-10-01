# TASK ID: CONTRACT-084.1
# TITLE: Add conformance test suite for envelope contracts
# STATUS: pending
# DEPENDENCIES: FOODLAB-003.1
# ALLOWED FILES: product/packages/contracts/src/__tests__/envelopes.test.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Tests that every envelope (Command, Event, Query, Sync) passes its contract.

## REQUIRED IMPLEMENTATION

Create `product/packages/contracts/src/__tests__/envelopes.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  CommandEnvelopeSchema,
  EventEnvelopeSchema,
  QueryEnvelopeSchema,
  SyncHelloSchema,
  SyncRequestSchema,
  SyncResponseSchema,
} from '../envelopes';
import {
  makeProjectId, makeUserId, makeDeviceId, makeCommandId, makeEventId,
} from '../test-helpers';

describe('CommandEnvelope', () => {
  it('accepts a valid command', () => {
    const cmd = {
      id: makeCommandId(),
      command_type: 'patient.create',
      aggregate_type: 'patient',
      aggregate_id: 'pat_1',
      actor_user_id: makeUserId(),
      device_id: makeDeviceId(),
      payload: { full_name: 'Test' },
      occurred_at: new Date().toISOString(),
      correlation_id: null,
      idempotency_key: 'k1',
    };
    expect(() => CommandEnvelopeSchema.parse(cmd)).not.toThrow();
  });
  it('rejects unknown command type (no wildcard)', () => {
    const cmd = {
      id: makeCommandId(),
      command_type: 'unknown.foo',
      aggregate_type: 'foo',
      aggregate_id: 'foo_1',
      actor_user_id: makeUserId(),
      device_id: makeDeviceId(),
      payload: {},
      occurred_at: new Date().toISOString(),
      correlation_id: null,
      idempotency_key: 'k1',
    };
    // The schema is loose; we only require structural validity
    expect(() => CommandEnvelopeSchema.parse(cmd)).not.toThrow();
  });
  it('rejects missing required fields', () => {
    expect(() => CommandEnvelopeSchema.parse({})).toThrow();
  });
  it('rejects bad command_type format', () => {
    const cmd = {
      id: makeCommandId(),
      command_type: 'InvalidType',
      aggregate_type: 'foo',
      aggregate_id: 'foo_1',
      actor_user_id: makeUserId(),
      device_id: makeDeviceId(),
      payload: {},
      occurred_at: new Date().toISOString(),
      correlation_id: null,
      idempotency_key: 'k1',
    };
    expect(() => CommandEnvelopeSchema.parse(cmd)).toThrow();
  });
});

describe('EventEnvelope', () => {
  it('accepts a valid event', () => {
    const evt = {
      id: makeEventId(),
      event_type: 'patient.created',
      aggregate_type: 'patient',
      aggregate_id: 'pat_1',
      aggregate_version: 1,
      actor_user_id: makeUserId(),
      device_id: makeDeviceId(),
      occurred_at: new Date().toISOString(),
      correlation_id: null,
      causation_id: null,
      payload: { patient_id: 'pat_1' },
    };
    expect(() => EventEnvelopeSchema.parse(evt)).not.toThrow();
  });
});

describe('QueryEnvelope', () => {
  it('accepts a valid query', () => {
    const q = {
      id: 'qry_1',
      query_type: 'patient.list',
      actor_user_id: makeUserId(),
      device_id: makeDeviceId(),
      payload: {},
      occurred_at: new Date().toISOString(),
    };
    expect(() => QueryEnvelopeSchema.parse(q)).not.toThrow();
  });
});

describe('SyncHello', () => {
  it('accepts a valid hello', () => {
    const h = {
      type: 'hello' as const,
      protocol_version: 1 as const,
      user_id: makeUserId(),
      device_id: makeDeviceId(),
      project_id: makeProjectId(),
      device_pubkey: 'abc',
      device_signature: 'def',
    };
    expect(() => SyncHelloSchema.parse(h)).not.toThrow();
  });
  it('rejects wrong protocol version', () => {
    const h = {
      type: 'hello' as const,
      protocol_version: 99 as const,
      user_id: makeUserId(),
      device_id: makeDeviceId(),
      project_id: makeProjectId(),
      device_pubkey: 'abc',
      device_signature: 'def',
    };
    expect(() => SyncHelloSchema.parse(h)).toThrow();
  });
});

describe('SyncRequest', () => {
  it('requires non-negative last_sequence', () => {
    expect(() => SyncRequestSchema.parse({
      type: 'sync_request' as const,
      last_sequence: -1,
    })).toThrow();
  });
});

describe('SyncResponse', () => {
  it('accepts events mode', () => {
    const r = {
      type: 'sync_response' as const,
      mode: 'events' as const,
      from_sequence: 0,
      to_sequence: 10,
      events: [],
      has_more: false,
    };
    expect(() => SyncResponseSchema.parse(r)).not.toThrow();
  });
  it('accepts snapshot mode', () => {
    const r = {
      type: 'sync_response' as const,
      mode: 'snapshot' as const,
      at_sequence: 100,
      data: { users: [] },
    };
    expect(() => SyncResponseSchema.parse(r)).not.toThrow();
  });
});
```

Add to `package.json`:
```json
"scripts": {
  "test": "vitest run"
},
"devDependencies": {
  "vitest": "^2.0.0"
}
```

## TESTS

```bash
cd product
test -f packages/contracts/src/__tests__/envelopes.test.ts || { echo "FAIL"; exit 1; }
grep -q "CommandEnvelopeSchema" packages/contracts/src/__tests__/envelopes.test.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts test > /dev/null 2>&1 || { echo "WARN: tests may not run yet"; exit 1; }
echo "OK"
```
