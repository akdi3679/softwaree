# TASK ID: COMMANDS-001.1
# TITLE: Add command catalog (single source of truth)
# STATUS: pending
# DEPENDENCIES: EVENTS-001.3
# ALLOWED FILES: product/packages/contracts/src/commands/catalog.ts, product/packages/contracts/src/commands/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
A central catalog of every command that can be issued, with their request/response schemas.

## REQUIRED IMPLEMENTATION

Create `product/packages/contracts/src/commands/catalog.ts`:

```typescript
import { z } from 'zod';

export interface CommandSpec {
  /** Fully-qualified command type, e.g. "patient.create" */
  type: string;
  /** Module that handles this command */
  module: string;
  /** Zod schema for the request payload */
  request: z.ZodType<any>;
  /** Zod schema for the response */
  response: z.ZodType<any>;
  /** Required permission */
  required_permission: string;
  /** Whether this command is allowed offline (v2 only) */
  offline_queueable: boolean;
  /** Doc */
  description: string;
}

class CommandCatalog {
  private byType = new Map<string, CommandSpec>();

  register(spec: CommandSpec) {
    if (this.byType.has(spec.type)) {
      throw new Error(`command type already registered: ${spec.type}`);
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

// Core commands
commandCatalog.register({
  type: 'project.create',
  module: 'core',
  request: z.object({ name: z.string().min(1), business_type: z.string() }),
  response: z.object({ project_id: z.string() }),
  required_permission: 'projects.create',
  offline_queueable: false,
  description: 'Create a new project',
});

commandCatalog.register({
  type: 'project.activate',
  module: 'core',
  request: z.object({ project_id: z.string() }),
  response: z.object({ project_id: z.string(), state: z.string() }),
  required_permission: 'projects.manage',
  offline_queueable: false,
  description: 'Activate a project',
});

commandCatalog.register({
  type: 'invitation.create',
  module: 'core',
  request: z.object({ email: z.string().email(), role: z.string() }),
  response: z.object({ invitation_id: z.string(), token: z.string(), expires_at: z.string() }),
  required_permission: 'users.invite',
  offline_queueable: false,
  description: 'Create a new invitation',
});

commandCatalog.register({
  type: 'user.create',
  module: 'core',
  request: z.object({
    email: z.string().email(),
    display_name: z.string(),
    initial_role: z.string(),
  }),
  response: z.object({ user_id: z.string() }),
  required_permission: 'users.manage',
  offline_queueable: false,
  description: 'Create a new user (typically from an accepted invitation)',
});

commandCatalog.register({
  type: 'user.change_role',
  module: 'core',
  request: z.object({ user_id: z.string(), new_role: z.string() }),
  response: z.object({ user_id: z.string(), role: z.string() }),
  required_permission: 'users.manage',
  offline_queueable: false,
  description: 'Change a user\'s role',
});

commandCatalog.register({
  type: 'user.remove',
  module: 'core',
  request: z.object({ user_id: z.string(), reason: z.string() }),
  response: z.object({}),
  required_permission: 'users.manage',
  offline_queueable: false,
  description: 'Remove a user from the project',
});

// Medical module commands
commandCatalog.register({
  type: 'patient.create',
  module: 'medical-reception',
  request: z.object({
    full_name: z.string().min(1),
    phone: z.string(),
    date_of_birth: z.string(),
  }),
  response: z.object({ patient_id: z.string() }),
  required_permission: 'patients.write',
  offline_queueable: false,
  description: 'Register a new patient',
});

commandCatalog.register({
  type: 'appointment.create',
  module: 'medical-reception',
  request: z.object({
    patient_id: z.string(),
    scheduled_for: z.string(),
    duration_minutes: z.number().int().positive(),
    reason: z.string(),
  }),
  response: z.object({ appointment_id: z.string() }),
  required_permission: 'appointments.write',
  offline_queueable: false,
  description: 'Schedule a new appointment',
});

// Food-lab module commands
commandCatalog.register({
  type: 'sample.intake',
  module: 'food-lab',
  request: z.object({
    client_name: z.string().min(1),
    sample_type: z.string(),
    collected_at: z.string(),
    notes: z.string().optional(),
  }),
  response: z.object({ sample_id: z.string() }),
  required_permission: 'samples.write',
  offline_queueable: false,
  description: 'Register a new sample',
});

commandCatalog.register({
  type: 'sample.start_test',
  module: 'food-lab',
  request: z.object({
    sample_id: z.string(),
    test_type: z.string(),
    assigned_tech: z.string(),
  }),
  response: z.object({ test_id: z.string() }),
  required_permission: 'samples.write',
  offline_queueable: false,
  description: 'Start a test on a sample',
});
```

Create `product/packages/contracts/src/commands/index.ts`:

```typescript
export * from './catalog';
```

## TESTS

```bash
cd product
test -f packages/contracts/src/commands/catalog.ts || { echo "FAIL"; exit 1; }
grep -q "commandCatalog" packages/contracts/src/commands/catalog.ts || { echo "FAIL"; exit 1; }
grep -q "patient.create" packages/contracts/src/commands/catalog.ts || { echo "FAIL: not registered"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
