import { z } from 'zod';
/**
 * Frame types for the Admin <-> User sync protocol.
 * All frames are CBOR-encoded with a 1-byte type, 4-byte payload length, then payload.
 */
export declare const FrameType: {
    readonly SYNC_HELLO: 1;
    readonly SYNC_ACK: 2;
    readonly EVENT_BATCH: 3;
    readonly SNAPSHOT_PAYLOAD: 4;
    readonly COMMAND_REQUEST: 16;
    readonly COMMAND_ACK_GOTTEN: 17;
    readonly COMMAND_APPLY_REQUEST: 18;
    readonly COMMAND_APPLIED: 19;
    readonly COMMAND_APPLY_CONFIRM: 20;
    readonly COMMAND_RESPONSE: 21;
    readonly HEARTBEAT: 32;
    readonly ERROR: 127;
};
export type FrameType = (typeof FrameType)[keyof typeof FrameType];
export declare const FrameTypeSchema: z.ZodNativeEnum<{
    readonly SYNC_HELLO: 1;
    readonly SYNC_ACK: 2;
    readonly EVENT_BATCH: 3;
    readonly SNAPSHOT_PAYLOAD: 4;
    readonly COMMAND_REQUEST: 16;
    readonly COMMAND_ACK_GOTTEN: 17;
    readonly COMMAND_APPLY_REQUEST: 18;
    readonly COMMAND_APPLIED: 19;
    readonly COMMAND_APPLY_CONFIRM: 20;
    readonly COMMAND_RESPONSE: 21;
    readonly HEARTBEAT: 32;
    readonly ERROR: 127;
}>;
/**
 * The CBOR frame header. The actual payload is encoded separately.
 */
export declare const FrameHeaderSchema: z.ZodObject<{
    type: z.ZodNativeEnum<{
        readonly SYNC_HELLO: 1;
        readonly SYNC_ACK: 2;
        readonly EVENT_BATCH: 3;
        readonly SNAPSHOT_PAYLOAD: 4;
        readonly COMMAND_REQUEST: 16;
        readonly COMMAND_ACK_GOTTEN: 17;
        readonly COMMAND_APPLY_REQUEST: 18;
        readonly COMMAND_APPLIED: 19;
        readonly COMMAND_APPLY_CONFIRM: 20;
        readonly COMMAND_RESPONSE: 21;
        readonly HEARTBEAT: 32;
        readonly ERROR: 127;
    }>;
    payloadLength: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: 1 | 2 | 3 | 4 | 16 | 17 | 18 | 19 | 20 | 21 | 32 | 127;
    payloadLength: number;
}, {
    type: 1 | 2 | 3 | 4 | 16 | 17 | 18 | 19 | 20 | 21 | 32 | 127;
    payloadLength: number;
}>;
export type FrameHeader = z.infer<typeof FrameHeaderSchema>;
//# sourceMappingURL=frame.d.ts.map