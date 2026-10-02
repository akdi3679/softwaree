import { z } from 'zod';
/**
 * The universal envelope for all events.
 *
 * Events are emitted by the Admin after a successful state change.
 * They are stored in the outbox and delivered to Users (or stored
 * for audit). The envelope carries identity, ordering, and payload.
 */
export declare const EventEnvelopeSchema: z.ZodObject<{
    eventId: z.ZodBranded<z.ZodString, "EventId">;
    eventType: z.ZodString;
    projectId: z.ZodBranded<z.ZodString, "ProjectId">;
    actorId: z.ZodBranded<z.ZodString, "UserId">;
    deviceId: z.ZodBranded<z.ZodString, "DeviceId">;
    sessionId: z.ZodBranded<z.ZodString, "SessionId">;
    occurredAt: z.ZodString;
    correlationId: z.ZodOptional<z.ZodString>;
    causationId: z.ZodOptional<z.ZodString>;
    aggregateType: z.ZodString;
    aggregateId: z.ZodString;
    aggregateVersion: z.ZodNumber;
    payload: z.ZodUnknown;
}, "strip", z.ZodTypeAny, {
    projectId: string & z.BRAND<"ProjectId">;
    actorId: string & z.BRAND<"UserId">;
    deviceId: string & z.BRAND<"DeviceId">;
    sessionId: string & z.BRAND<"SessionId">;
    eventId: string & z.BRAND<"EventId">;
    eventType: string;
    occurredAt: string;
    aggregateType: string;
    aggregateId: string;
    aggregateVersion: number;
    correlationId?: string | undefined;
    causationId?: string | undefined;
    payload?: unknown;
}, {
    projectId: string;
    actorId: string;
    deviceId: string;
    sessionId: string;
    eventId: string;
    eventType: string;
    occurredAt: string;
    aggregateType: string;
    aggregateId: string;
    aggregateVersion: number;
    correlationId?: string | undefined;
    causationId?: string | undefined;
    payload?: unknown;
}>;
export type EventEnvelope<TPayload = unknown> = Omit<z.infer<typeof EventEnvelopeSchema>, 'payload'> & {
    payload: TPayload;
};
//# sourceMappingURL=envelope.d.ts.map