# TASK ID: CONTRACT-089.1
# TITLE: Add contract: comprehensive Zod schema for events
# STATUS: pending
# DEPENDENCIES: CLOUD-023.2
# ALLOWED FILES: product/contracts/src/schemas/event.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Single source of truth for every event payload.

## REQUIRED IMPLEMENTATION

Create `product/contracts/src/schemas/event.ts`:

```typescript
import { z } from 'zod';

// Base envelope
export const EventEnvelopeSchema = z.object({
  id: z.string().regex(/^evt_[a-z2-7]{22}$/),
  event_type: z.string().min(1).max(100),
  aggregate_type: z.string().min(1).max(50),
  aggregate_id: z.string().min(1).max(100),
  version: z.number().int().min(1),
  occurred_at: z.string().datetime(),
  payload: z.record(z.unknown()),
  actor_id: z.string().regex(/^(usr|dev)_[a-z2-7]{22}$/),
  device_id: z.string().regex(/^dev_[a-z2-7]{22}$/),
  command_id: z.string().regex(/^cmd_[a-z2-7]{22}$/),
  idempotency_key: z.string().min(1).max(100),
  sequence: z.number().int().min(1).optional(),
  hash: z.string().optional(),
  prev_hash: z.string().optional(),
});

// Specific event payload schemas
export const PatientCreatedSchema = EventEnvelopeSchema.extend({
  event_type: z.literal('patient.created'),
  payload: z.object({
    patient_id: z.string().regex(/^pat_[a-z2-7]{22}$/),
    full_name: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email().optional(),
    date_of_birth: z.string(),
    gender: z.enum(['male', 'female', 'other']),
  }),
});

export const PatientUpdatedSchema = EventEnvelopeSchema.extend({
  event_type: z.literal('patient.updated'),
  payload: z.object({
    patient_id: z.string().regex(/^pat_[a-z2-7]{22}$/),
    changes: z.record(z.unknown()),
  }),
});

export const AppointmentCreatedSchema = EventEnvelopeSchema.extend({
  event_type: z.literal('appointment.created'),
  payload: z.object({
    appointment_id: z.string().regex(/^apt_[a-z2-7]{22}$/),
    patient_id: z.string().regex(/^pat_[a-z2-7]{22}$/),
    scheduled_at: z.string().datetime(),
    duration_min: z.number().int().min(1).max(480),
    doctor_id: z.string().regex(/^usr_[a-z2-7]{22}$/),
  }),
});

// Union of all known events
export const AnyEventSchema = z.discriminatedUnion('event_type', [
  PatientCreatedSchema,
  PatientUpdatedSchema,
  AppointmentCreatedSchema,
  // ... add more as we add more event types
]);

export type AnyEvent = z.infer<typeof AnyEventSchema>;
```

## TESTS

```bash
cd product
test -f contracts/src/schemas/event.ts || { echo "FAIL"; exit 1; }
grep -q "AnyEventSchema" contracts/src/schemas/event.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
