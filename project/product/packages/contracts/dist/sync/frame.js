import { z } from 'zod';
/**
 * Frame types for the Admin <-> User sync protocol.
 * All frames are CBOR-encoded with a 1-byte type, 4-byte payload length, then payload.
 */
export const FrameType = {
    SYNC_HELLO: 0x01,
    SYNC_ACK: 0x02,
    EVENT_BATCH: 0x03,
    SNAPSHOT_PAYLOAD: 0x04,
    COMMAND_REQUEST: 0x10,
    COMMAND_ACK_GOTTEN: 0x11,
    COMMAND_APPLY_REQUEST: 0x12,
    COMMAND_APPLIED: 0x13,
    COMMAND_APPLY_CONFIRM: 0x14,
    COMMAND_RESPONSE: 0x15,
    HEARTBEAT: 0x20,
    ERROR: 0x7F,
};
export const FrameTypeSchema = z.nativeEnum(FrameType);
/**
 * The CBOR frame header. The actual payload is encoded separately.
 */
export const FrameHeaderSchema = z.object({
    type: FrameTypeSchema,
    payloadLength: z.number().int().min(0).max(16 * 1024 * 1024), // 16 MB max
});
//# sourceMappingURL=frame.js.map