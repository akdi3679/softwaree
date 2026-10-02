import { z } from "zod";

export interface CommandSpec {
  type: string;
  module: string;
  request: z.ZodType<unknown>;
  response: z.ZodType<unknown>;
  required_permission: string;
  offline_queueable: boolean;
  description: string;
}

class CommandCatalog {
  private byType = new Map<string, CommandSpec>();

  register(spec: CommandSpec) {
    if (this.byType.has(spec.type)) {
      throw new Error("command type already registered: " + spec.type);
    }
    this.byType.set(spec.type, spec);
  }

  get(type: string): CommandSpec | undefined {
    return this.byType.get(type);
  }

  list(): CommandSpec[] {
    return Array.from(this.byType.values());
  }

  byModule(module: string): CommandSpec[] {
    return this.list().filter((s) => s.module === module);
  }
}

export const commandCatalog = new CommandCatalog();

commandCatalog.register({
  type: "project.create",
  module: "core",
  request: z.object({ name: z.string().min(1), business_type: z.string() }),
  response: z.object({ project_id: z.string() }),
  required_permission: "projects.create",
  offline_queueable: false,
  description: "Create a new project",
});

commandCatalog.register({
  type: "invitation.create",
  module: "core",
  request: z.object({ email: z.string().email(), role: z.string() }),
  response: z.object({
    invitation_id: z.string(),
    token: z.string(),
    expires_at: z.string(),
  }),
  required_permission: "users.invite",
  offline_queueable: false,
  description: "Create a new invitation",
});

commandCatalog.register({
  type: "user.create",
  module: "core",
  request: z.object({
    email: z.string().email(),
    display_name: z.string(),
    initial_role: z.string(),
  }),
  response: z.object({ user_id: z.string() }),
  required_permission: "users.manage",
  offline_queueable: false,
  description: "Create a new user",
});

commandCatalog.register({
  type: "user.change_role",
  module: "core",
  request: z.object({ user_id: z.string(), new_role: z.string() }),
  response: z.object({ user_id: z.string(), role: z.string() }),
  required_permission: "users.manage",
  offline_queueable: false,
  description: "Change a user role",
});

commandCatalog.register({
  type: "user.remove",
  module: "core",
  request: z.object({ user_id: z.string(), reason: z.string() }),
  response: z.object({}),
  required_permission: "users.manage",
  offline_queueable: false,
  description: "Remove a user from the project",
});

commandCatalog.register({
  type: "patient.create",
  module: "medical-reception",
  request: z.object({
    full_name: z.string().min(1),
    phone: z.string(),
    date_of_birth: z.string(),
  }),
  response: z.object({ patient_id: z.string() }),
  required_permission: "patients.write",
  offline_queueable: false,
  description: "Register a new patient",
});

commandCatalog.register({
  type: "appointment.create",
  module: "medical-reception",
  request: z.object({
    patient_id: z.string(),
    scheduled_for: z.string(),
    duration_minutes: z.number().int().positive(),
    reason: z.string(),
  }),
  response: z.object({ appointment_id: z.string() }),
  required_permission: "appointments.write",
  offline_queueable: false,
  description: "Schedule a new appointment",
});

commandCatalog.register({
  type: "sample.intake",
  module: "food-lab",
  request: z.object({
    client_name: z.string().min(1),
    sample_type: z.string(),
    collected_at: z.string(),
    notes: z.string().optional(),
  }),
  response: z.object({ sample_id: z.string() }),
  required_permission: "samples.write",
  offline_queueable: false,
  description: "Register a new sample",
});

commandCatalog.register({
  type: "sample.start_test",
  module: "food-lab",
  request: z.object({
    sample_id: z.string(),
    test_type: z.string(),
    assigned_tech: z.string(),
  }),
  response: z.object({ test_id: z.string() }),
  required_permission: "samples.write",
  offline_queueable: false,
  description: "Start a test on a sample",
});
