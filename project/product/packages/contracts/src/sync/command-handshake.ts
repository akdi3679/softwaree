import { z } from 'zod';
import { CommandIdSchema } from '../identity/command-id';
import { ProjectIdSchema } from '../identity/project-id';
import { DeviceIdSchema } from '../identity/device-id';
import { UserIdSchema } from '../identity/user-id';
import { SessionIdSchema } from '../identity/session-id';
import { ProjectSequenceSchema } from '../version/project-sequence';

// 1. User sends a CommandRequest to Admin
export const CommandRequestSchema = z.object({
  commandId: CommandIdSchema,
  commandType: z.string().min(1),
  projectId: ProjectIdSchema,
  actorId: UserIdSchema,
  deviceId: DeviceIdSchema,
  sessionId: SessionIdSchema,
  idempotencyKey: z.string().uuid(),
  payload: z.unknown(),
});

export type CommandRequest = z.infer<typeof CommandRequestSchema>;

// 2. Admin responds CommandAckGotten (held, not applied)
export const CommandAckGottenSchema = z.object({
  commandId: CommandIdSchema,
  receivedAt: z.string().datetime(),
  holdToken: z.string().uuid(), // used to correlate later apply
});

export type CommandAckGotten = z.infer<typeof CommandAckGottenSchema>;

// 3. User sends CommandApplyRequest
export const CommandApplyRequestSchema = z.object({
  commandId: CommandIdSchema,
  holdToken: z.string().uuid(),
});

export type CommandApplyRequest = z.infer<typeof CommandApplyRequestSchema>;

// 4. Admin applies and sends CommandApplied
export const CommandAppliedSchema = z.object({
  commandId: CommandIdSchema,
  resultingSequence: ProjectSequenceSchema,
  appliedAt: z.string().datetime(),
  result: z.unknown(),
});

export type CommandApplied = z.infer<typeof CommandAppliedSchema>;

// 5. User sends CommandApplyConfirm (optional)
export const CommandApplyConfirmSchema = z.object({
  commandId: CommandIdSchema,
  confirmedAt: z.string().datetime(),
});

export type CommandApplyConfirm = z.infer<typeof CommandApplyConfirmSchema>;

// 6. Generic CommandResponse (error or ack)
export const CommandResponseSchema = z.object({
  commandId: CommandIdSchema,
  ok: z.boolean(),
  error: z.unknown().optional(),
});

export type CommandResponse = z.infer<typeof CommandResponseSchema>;
