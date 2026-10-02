import { z } from 'zod';

/**
 * Frame types for the Admin <-> User sync protocol.
 * All frames are CBOR-encoded with a 1-byte type, 4-byte payload length, then payload.
 */
export const FrameType = {
  SYNC_HELLO: 0x01,
  SYNC_WELCOME: 0x02,
  SYNC_REQUEST: 0x03,
  SYNC_RESPONSE: 0x04,
  EVENT: 0x05,
  SNAPSHOT: 0x06,
  ACK: 0x07,
  COMMAND_REQUEST: 0x10,
  COMMAND_ACK_GOTTEN: 0x11,
  COMMAND_APPLY_REQUEST: 0x12,
  COMMAND_APPLIED: 0x13,
  COMMAND_APPLY_CONFIRM: 0x14,
  COMMAND_RESPONSE: 0x15,
  HEARTBEAT: 0x20,
  HEARTBEAT_ACK: 0x21,
  ERROR: 0x7F,
} as const;

export type FrameType = (typeof FrameType)[keyof typeof FrameType];

export const FrameTypeSchema = z.nativeEnum(FrameType);

export const FrameHeaderSchema = z.object({
  type: FrameTypeSchema,
  payloadLength: z.number().int().min(0).max(16 * 1024 * 1024),
});

export type FrameHeader = z.infer<typeof FrameHeaderSchema>;
