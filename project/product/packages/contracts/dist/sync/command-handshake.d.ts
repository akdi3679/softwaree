import { z } from 'zod';
export declare const CommandRequestSchema: z.ZodObject<{
    commandId: z.ZodBranded<z.ZodString, "CommandId">;
    commandType: z.ZodString;
    projectId: z.ZodBranded<z.ZodString, "ProjectId">;
    actorId: z.ZodBranded<z.ZodString, "UserId">;
    deviceId: z.ZodBranded<z.ZodString, "DeviceId">;
    sessionId: z.ZodBranded<z.ZodString, "SessionId">;
    idempotencyKey: z.ZodString;
    payload: z.ZodUnknown;
}, "strip", z.ZodTypeAny, {
    commandId: string & z.BRAND<"CommandId">;
    commandType: string;
    projectId: string & z.BRAND<"ProjectId">;
    actorId: string & z.BRAND<"UserId">;
    deviceId: string & z.BRAND<"DeviceId">;
    sessionId: string & z.BRAND<"SessionId">;
    idempotencyKey: string;
    payload?: unknown;
}, {
    commandId: string;
    commandType: string;
    projectId: string;
    actorId: string;
    deviceId: string;
    sessionId: string;
    idempotencyKey: string;
    payload?: unknown;
}>;
export type CommandRequest = z.infer<typeof CommandRequestSchema>;
export declare const CommandAckGottenSchema: z.ZodObject<{
    commandId: z.ZodBranded<z.ZodString, "CommandId">;
    receivedAt: z.ZodString;
    holdToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    commandId: string & z.BRAND<"CommandId">;
    receivedAt: string;
    holdToken: string;
}, {
    commandId: string;
    receivedAt: string;
    holdToken: string;
}>;
export type CommandAckGotten = z.infer<typeof CommandAckGottenSchema>;
export declare const CommandApplyRequestSchema: z.ZodObject<{
    commandId: z.ZodBranded<z.ZodString, "CommandId">;
    holdToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    commandId: string & z.BRAND<"CommandId">;
    holdToken: string;
}, {
    commandId: string;
    holdToken: string;
}>;
export type CommandApplyRequest = z.infer<typeof CommandApplyRequestSchema>;
export declare const CommandAppliedSchema: z.ZodObject<{
    commandId: z.ZodBranded<z.ZodString, "CommandId">;
    resultingSequence: z.ZodBranded<z.ZodBigInt, "ProjectSequence">;
    appliedAt: z.ZodString;
    result: z.ZodUnknown;
}, "strip", z.ZodTypeAny, {
    commandId: string & z.BRAND<"CommandId">;
    resultingSequence: bigint & z.BRAND<"ProjectSequence">;
    appliedAt: string;
    result?: unknown;
}, {
    commandId: string;
    resultingSequence: bigint;
    appliedAt: string;
    result?: unknown;
}>;
export type CommandApplied = z.infer<typeof CommandAppliedSchema>;
export declare const CommandApplyConfirmSchema: z.ZodObject<{
    commandId: z.ZodBranded<z.ZodString, "CommandId">;
    confirmedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    commandId: string & z.BRAND<"CommandId">;
    confirmedAt: string;
}, {
    commandId: string;
    confirmedAt: string;
}>;
export type CommandApplyConfirm = z.infer<typeof CommandApplyConfirmSchema>;
export declare const CommandResponseSchema: z.ZodObject<{
    commandId: z.ZodBranded<z.ZodString, "CommandId">;
    ok: z.ZodBoolean;
    error: z.ZodOptional<z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    commandId: string & z.BRAND<"CommandId">;
    ok: boolean;
    error?: unknown;
}, {
    commandId: string;
    ok: boolean;
    error?: unknown;
}>;
export type CommandResponse = z.infer<typeof CommandResponseSchema>;
//# sourceMappingURL=command-handshake.d.ts.map