# TASK ID: EVENTS-001.1
# TITLE: Add event schema versioning
# STATUS: pending
# DEPENDENCIES: PERFORMANCE-001.4
# ALLOWED FILES: product/packages/contracts/src/events/versioning.ts, product/packages/contracts/src/events/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Add event schema versioning — every event has a schema version, upgraders transform old to new.

## REQUIRED IMPLEMENTATION

Create `product/packages/contracts/src/events/versioning.ts`:

```typescript
import type { z } from 'zod';

export const CURRENT_SCHEMA_VERSION = 1;

export interface VersionedEvent<T = unknown> {
  schema_version: number;
  event_type: string;
  payload: T;
}

export type Upgrader = (oldPayload: unknown, oldVersion: number) => unknown;

export class EventUpgrader {
  private upgraders = new Map<string, Upgrader[]>();

  /** Register an upgrader for event_type. Versions must be 1..N. */
  register(eventType: string, upgraders: Upgrader[]) {
    if (upgraders.length !== CURRENT_SCHEMA_VERSION) {
      throw new Error(`expected ${CURRENT_SCHEMA_VERSION - 1} upgraders, got ${upgraders.length}`);
    }
    this.upgraders.set(eventType, upgraders);
  }

  /** Upgrade a single event to the current version. */
  upgrade<T>(event: VersionedEvent): VersionedEvent<T> {
    if (event.schema_version === CURRENT_SCHEMA_VERSION) {
      return event as VersionedEvent<T>;
    }
    const upgraders = this.upgraders.get(event.event_type);
    if (!upgraders) {
      throw new Error(`no upgraders registered for ${event.event_type}`);
    }
    let payload = event.payload;
    for (let v = event.schema_version; v < CURRENT_SCHEMA_VERSION; v++) {
      payload = upgraders[v - 1](payload, v);
    }
    return { schema_version: CURRENT_SCHEMA_VERSION, event_type: event.event_type, payload: payload as T };
  }
}

/** Helper: assert payload shape, then upgrade. */
export function migrateEvent<T>(
  upgrader: EventUpgrader,
  raw: VersionedEvent,
  targetSchema: z.ZodType<T>,
): T {
  const upgraded = upgrader.upgrade<T>(raw);
  return targetSchema.parse(upgraded.payload);
}
```

Create `product/packages/contracts/src/events/index.ts`:

```typescript
export * from './versioning';
export * from './types';
```

Create `product/packages/contracts/src/events/types.ts`:

```typescript
import { z } from 'zod';

/** Schema for all events. */
export const PatientCreatedV1 = z.object({
  patient_id: z.string(),
  full_name: z.string(),
  phone: z.string(),
  date_of_birth: z.string(),
});

export const PatientCreatedV2 = z.object({
  patient_id: z.string(),
  full_name: z.string(),
  phone: z.string(),
  date_of_birth: z.string(),
  created_by_user_id: z.string(),
  created_at: z.string(),
});

/** Upgrader from v1 to v2: add created_by and created_at. */
export function upgradePatientCreatedV1ToV2(old: unknown): unknown {
  const v1 = PatientCreatedV1.parse(old);
  return {
    ...v1,
    created_by_user_id: 'unknown',
    created_at: new Date(0).toISOString(),
  };
}

export const PatientCreated = {
  V1: PatientCreatedV1,
  V2: PatientCreatedV2,
  current: PatientCreatedV2,
};
```

## TESTS

```bash
cd product
test -f packages/contracts/src/events/versioning.ts || { echo "FAIL"; exit 1; }
test -f packages/contracts/src/events/types.ts || { echo "FAIL: no types"; exit 1; }
grep -q "EventUpgrader" packages/contracts/src/events/versioning.ts || { echo "FAIL"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
