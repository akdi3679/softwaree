# TASK ID: EVENTS-001.2
# TITLE: Add event registry — single source of truth for all event types
# STATUS: pending
# DEPENDENCIES: EVENTS-001.1
# ALLOWED FILES: product/packages/contracts/src/events/registry.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
A central registry listing every event type emitted by every module. Used for documentation, validation, and tooling.

## REQUIRED IMPLEMENTATION

Create `product/packages/contracts/src/events/registry.ts`:

```typescript
import { z } from 'zod';

export interface EventSpec {
  /** Fully-qualified event type, e.g. "patient.created" */
  type: string;
  /** Module that emits this event */
  module: string;
  /** Zod schema for the payload */
  schema: z.ZodType<any>;
  /** Schema version */
  version: number;
  /** Aggregate type this event applies to */
  aggregate_type: string;
  /** Whether the event carries PHI (sensitive) */
  sensitive: boolean;
  /** Doc */
  description: string;
}

class EventRegistry {
  private byType = new Map<string, EventSpec>();

  register(spec: EventSpec) {
    if (this.byType.has(spec.type)) {
      throw new Error(`event type already registered: ${spec.type}`);
    }
    this.byType.set(spec.type, spec);
  }

  get(type: string): EventSpec | undefined {
    return this.byType.get(type);
  }

  list(): EventSpec[] {
    return Array.from(this.byType.values());
  }

  byModule(module: string): EventSpec[] {
    return this.list().filter((s) => s.module === module);
  }
}

export const eventRegistry = new EventRegistry();

// Built-in events from the core
eventRegistry.register({
  type: 'project.created',
  module: 'core',
  schema: z.object({
    project_id: z.string(),
    name: z.string(),
    business_type: z.string(),
  }),
  version: 1,
  aggregate_type: 'project',
  sensitive: false,
  description: 'A new project was created',
});

eventRegistry.register({
  type: 'project.activated',
  module: 'core',
  schema: z.object({ project_id: z.string() }),
  version: 1,
  aggregate_type: 'project',
  sensitive: false,
  description: 'A project was activated',
});

eventRegistry.register({
  type: 'project.suspended',
  module: 'core',
  schema: z.object({ project_id: z.string(), reason: z.string() }),
  version: 1,
  aggregate_type: 'project',
  sensitive: false,
  description: 'A project was suspended',
});

eventRegistry.register({
  type: 'user.created',
  module: 'core',
  schema: z.object({
    user_id: z.string(),
    email: z.string().email(),
    display_name: z.string(),
  }),
  version: 1,
  aggregate_type: 'user',
  sensitive: true,
  description: 'A new user was added to the project',
});

eventRegistry.register({
  type: 'user.role_changed',
  module: 'core',
  schema: z.object({ user_id: z.string(), new_role: z.string() }),
  version: 1,
  aggregate_type: 'user',
  sensitive: true,
  description: 'A user\'s role was changed',
});

eventRegistry.register({
  type: 'user.removed',
  module: 'core',
  schema: z.object({ user_id: z.string(), reason: z.string() }),
  version: 1,
  aggregate_type: 'user',
  sensitive: true,
  description: 'A user was removed from the project',
});

eventRegistry.register({
  type: 'invitation.created',
  module: 'core',
  schema: z.object({
    invitation_id: z.string(),
    email: z.string().email(),
    role: z.string(),
  }),
  version: 1,
  aggregate_type: 'invitation',
  sensitive: true,
  description: 'A new invitation was created',
});

// Medical events
eventRegistry.register({
  type: 'patient.created',
  module: 'medical-reception',
  schema: z.object({
    patient_id: z.string(),
    full_name: z.string(),
    phone: z.string(),
    date_of_birth: z.string(),
  }),
  version: 1,
  aggregate_type: 'patient',
  sensitive: true,
  description: 'A new patient was registered',
});

eventRegistry.register({
  type: 'appointment.created',
  module: 'medical-reception',
  schema: z.object({
    appointment_id: z.string(),
    patient_id: z.string(),
    scheduled_for: z.string(),
    duration_minutes: z.number().int().positive(),
    reason: z.string(),
    status: z.string(),
  }),
  version: 1,
  aggregate_type: 'appointment',
  sensitive: true,
  description: 'An appointment was scheduled',
});

// Food-lab events
eventRegistry.register({
  type: 'sample.intaken',
  module: 'food-lab',
  schema: z.object({
    sample_id: z.string(),
    client_name: z.string(),
    sample_type: z.string(),
    collected_at: z.string(),
    notes: z.string().nullable().optional(),
    status: z.string(),
  }),
  version: 1,
  aggregate_type: 'sample',
  sensitive: false,
  description: 'A new sample was received',
});

eventRegistry.register({
  type: 'sample.test_started',
  module: 'food-lab',
  schema: z.object({
    sample_id: z.string(),
    test_id: z.string(),
    test_type: z.string(),
    assigned_tech: z.string(),
    started_at: z.string(),
  }),
  version: 1,
  aggregate_type: 'sample',
  sensitive: false,
  description: 'A test was started on a sample',
});

eventRegistry.register({
  type: 'sample.result_recorded',
  module: 'food-lab',
  schema: z.object({
    sample_id: z.string(),
    test_id: z.string(),
    measurements: z.record(z.unknown()),
    passed: z.boolean(),
    recorded_at: z.string(),
  }),
  version: 1,
  aggregate_type: 'sample',
  sensitive: false,
  description: 'Test results were recorded',
});
```

## TESTS

```bash
cd product
test -f packages/contracts/src/events/registry.ts || { echo "FAIL"; exit 1; }
grep -q "eventRegistry" packages/contracts/src/events/registry.ts || { echo "FAIL"; exit 1; }
grep -q "patient.created" packages/contracts/src/events/registry.ts || { echo "FAIL: not registered"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
