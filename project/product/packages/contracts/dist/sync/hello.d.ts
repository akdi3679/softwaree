import { z } from 'zod';
/**
 * The opening message of a sync session. Sent by User to Admin.
 *
 * Includes the User's identity, its last known cursor, and the
 * schemas it understands. The Admin responds with what it can serve.
 */
export declare const SyncHelloSchema: z.ZodObject<{
    protocolVersion: z.ZodLiteral<1>;
    projectId: z.ZodBranded<z.ZodString, "ProjectId">;
    userId: z.ZodBranded<z.ZodString, "UserId">;
    deviceId: z.ZodBranded<z.ZodString, "DeviceId">;
    sessionId: z.ZodBranded<z.ZodString, "SessionId">;
    lastAppliedSequence: z.ZodBranded<z.ZodBigInt, "ProjectSequence">;
    schemaVersion: z.ZodBranded<z.ZodString, "SchemaVersion">;
    projectionFormatVersion: z.ZodNumber;
    clientCapabilities: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    projectId: string & z.BRAND<"ProjectId">;
    deviceId: string & z.BRAND<"DeviceId">;
    sessionId: string & z.BRAND<"SessionId">;
    userId: string & z.BRAND<"UserId">;
    schemaVersion: string & z.BRAND<"SchemaVersion">;
    protocolVersion: 1;
    lastAppliedSequence: bigint & z.BRAND<"ProjectSequence">;
    projectionFormatVersion: number;
    clientCapabilities: string[];
}, {
    projectId: string;
    deviceId: string;
    sessionId: string;
    userId: string;
    schemaVersion: string;
    protocolVersion: 1;
    lastAppliedSequence: bigint;
    projectionFormatVersion: number;
    clientCapabilities?: string[] | undefined;
}>;
export type SyncHello = z.infer<typeof SyncHelloSchema>;
//# sourceMappingURL=hello.d.ts.map