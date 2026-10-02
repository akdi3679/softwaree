import { z } from 'zod';
/**
 * The universal envelope for all commands.
 *
 * Every command � whether from User to Admin, or from Admin to Cloud �
 * is wrapped in this envelope. The envelope carries:
 *  - identity (command, project, actor, device, session)
 *  - correlation/causation for tracing
 *  - idempotency key (so retries are safe)
 *  - payload (the actual command, type-specific)
 *
 * The envelope is generic over the payload type. Specific commands
 * (CreatePatient, UpdateAppointment, etc.) are defined as separate
 * Zod schemas that extend this envelope.
 */
export declare const CommandEnvelopeSchema: z.ZodObject<{
    commandId: z.ZodBranded<z.ZodString, "CommandId">;
    commandType: z.ZodString;
    projectId: z.ZodBranded<z.ZodString, "ProjectId">;
    actorId: z.ZodBranded<z.ZodString, "UserId">;
    deviceId: z.ZodBranded<z.ZodString, "DeviceId">;
    sessionId: z.ZodBranded<z.ZodString, "SessionId">;
    createdAt: z.ZodString;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    idempotencyKey: z.ZodString;
    payload: z.ZodUnknown;
}, "strip", z.ZodTypeAny, {
    commandId: string & z.BRAND<"CommandId">;
    commandType: string;
    projectId: string & z.BRAND<"ProjectId">;
    actorId: string & z.BRAND<"UserId">;
    deviceId: string & z.BRAND<"DeviceId">;
    sessionId: string & z.BRAND<"SessionId">;
    createdAt: string;
    idempotencyKey: string;
    correlationId?: string | undefined;
    causationId?: string | undefined;
    payload?: unknown;
}, {
    commandId: string;
    commandType: string;
    projectId: string;
    actorId: string;
    deviceId: string;
    sessionId: string;
    createdAt: string;
    idempotencyKey: string;
    correlationId?: string | undefined;
    causationId?: string | undefined;
    payload?: unknown;
}>;
export type CommandEnvelope<TPayload = unknown> = Omit<z.infer<typeof CommandEnvelopeSchema>, 'payload'> & {
    payload: TPayload;
};
//# sourceMappingURL=envelope.d.ts.map