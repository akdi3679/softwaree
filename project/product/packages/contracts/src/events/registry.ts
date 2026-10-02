import { z } from "zod";

export interface EventSpec {
  type: string;
  module: string;
  schema: z.ZodType<unknown>;
  version: number;
  aggregate_type: string;
  sensitive: boolean;
  description: string;
}

class EventRegistry {
  private byType = new Map<string, EventSpec>();

  register(spec: EventSpec) {
    if (this.byType.has(spec.type)) {
      throw new Error("event type already registered: " + spec.type);
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

eventRegistry.register({
  type: "project.created",
  module: "core",
  schema: z.object({
    project_id: z.string(),
    name: z.string(),
    business_type: z.string(),
  }),
  version: 1,
  aggregate_type: "project",
  sensitive: false,
  description: "A new project was created",
});

eventRegistry.register({
  type: "user.created",
  module: "core",
  schema: z.object({
    user_id: z.string(),
    email: z.string().email(),
    display_name: z.string(),
  }),
  version: 1,
  aggregate_type: "user",
  sensitive: true,
  description: "A new user was added to the project",
});

eventRegistry.register({
  type: "user.role_changed",
  module: "core",
  schema: z.object({ user_id: z.string(), new_role: z.string() }),
  version: 1,
  aggregate_type: "user",
  sensitive: true,
  description: "A user role was changed",
});

eventRegistry.register({
  type: "user.removed",
  module: "core",
  schema: z.object({ user_id: z.string(), reason: z.string() }),
  version: 1,
  aggregate_type: "user",
  sensitive: true,
  description: "A user was removed",
});

eventRegistry.register({
  type: "invitation.created",
  module: "core",
  schema: z.object({
    invitation_id: z.string(),
    email: z.string().email(),
    role: z.string(),
  }),
  version: 1,
  aggregate_type: "invitation",
  sensitive: true,
  description: "A new invitation was created",
});

eventRegistry.register({
  type: "patient.created",
  module: "medical-reception",
  schema: z.object({
    patient_id: z.string(),
    full_name: z.string(),
    phone: z.string(),
    date_of_birth: z.string(),
  }),
  version: 1,
  aggregate_type: "patient",
  sensitive: true,
  description: "A new patient was registered",
});

eventRegistry.register({
  type: "appointment.created",
  module: "medical-reception",
  schema: z.object({
    appointment_id: z.string(),
    patient_id: z.string(),
    scheduled_for: z.string(),
    duration_minutes: z.number().int().positive(),
    reason: z.string(),
    status: z.string(),
  }),
  version: 1,
  aggregate_type: "appointment",
  sensitive: true,
  description: "An appointment was scheduled",
});

eventRegistry.register({
  type: "sample.intaken",
  module: "food-lab",
  schema: z.object({
    sample_id: z.string(),
    client_name: z.string(),
    notes: z.string().nullable().optional(),
  }),
  version: 1,
  aggregate_type: "sample",
  sensitive: false,
  description: "A new sample was received",
});

eventRegistry.register({
  type: "sample.test_started",
  module: "food-lab",
  schema: z.object({
    sample_id: z.string(),
    test_id: z.string(),
    test_type: z.string(),
    assigned_tech: z.string(),
    started_at: z.string(),
  }),
  version: 1,
  aggregate_type: "sample",
  sensitive: false,
  description: "A test was started on a sample",
});

eventRegistry.register({
  type: "sample.result_recorded",
  module: "food-lab",
  schema: z.object({
    sample_id: z.string(),
    test_id: z.string(),
    measurements: z.record(z.unknown()),
    passed: z.boolean(),
    recorded_at: z.string(),
  }),
  version: 1,
  aggregate_type: "sample",
  sensitive: false,
  description: "Test results were recorded",
});