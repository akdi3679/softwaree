import { z } from 'zod';
/**
 * The universal envelope for all queries.
 *
 * Queries are read-only. They don't have idempotency keys (queries are
 * naturally idempotent) or causation IDs (queries don't cause events).
 *
 * The result is sent back to the caller (User or Admin). Queries can
 * also be sent to a User's local projection (e.g., from the Admin's UI).
 */
export declare const QueryEnvelopeSchema: z.ZodObject<{
    queryId: z.ZodString;
    queryType: z.ZodString;
    projectId: z.ZodBranded<z.ZodString, "ProjectId">;
    actorId: z.ZodBranded<z.ZodString, "UserId">;
    deviceId: z.ZodBranded<z.ZodString, "DeviceId">;
    sessionId: z.ZodBranded<z.ZodString, "SessionId">;
    createdAt: z.ZodString;
    correlationId: z.ZodOptional<z.ZodString>;
    payload: z.ZodUnknown;
}, "strip", z.ZodTypeAny, {
    projectId: string & z.BRAND<"ProjectId">;
    actorId: string & z.BRAND<"UserId">;
    deviceId: string & z.BRAND<"DeviceId">;
    sessionId: string & z.BRAND<"SessionId">;
    createdAt: string;
    queryId: string;
    queryType: string;
    correlationId?: string | undefined;
    payload?: unknown;
}, {
    projectId: string;
    actorId: string;
    deviceId: string;
    sessionId: string;
    createdAt: string;
    queryId: string;
    queryType: string;
    correlationId?: string | undefined;
    payload?: unknown;
}>;
export type QueryEnvelope<TPayload = unknown> = Omit<z.infer<typeof QueryEnvelopeSchema>, 'payload'> & {
    payload: TPayload;
};
//# sourceMappingURL=envelope.d.ts.map