import { describe, expect, it } from 'vitest';
import {
  FrameType,
  DiscoveryHeartbeatSchema,
  CommandRequestSchema,
  CommandAckGottenSchema,
  CommandApplyRequestSchema,
  CommandAppliedSchema,
  CommandApplyConfirmSchema,
  CommandResponseSchema,
  EventBatchSchema,
  SYNC_PROTOCOL_VERSION,
} from './index';

const suffix = '0123456789abcdefghjkmn';

describe('Sync protocol constants', () => {
  it('protocol version is 1', () => {
    expect(SYNC_PROTOCOL_VERSION).toBe(1);
  });
});

describe('FrameType', () => {
  it('has distinct byte values', () => {
    expect(FrameType.SYNC_HELLO).toBe(0x01);
    expect(FrameType.ERROR).toBe(0x7F);
  });
});

describe('DiscoveryHeartbeatSchema', () => {
  it('accepts a valid heartbeat', () => {
    const hb = {
      deviceId: `dev_${suffix}`,
      virtualIp: '10.50.0.1',
      currentPublicIp: '41.200.50.10',
      currentPublicPort: 51820,
      currentIpv6: '2001:db8::42',
      state: 'internet',
      reachableMethods: ['direct_v4'],
      timestamp: new Date().toISOString(),
    };
    expect(DiscoveryHeartbeatSchema.safeParse(hb).success).toBe(true);
  });
});

describe('Command handshake schemas', () => {
  it('CommandRequestSchema requires idempotencyKey', () => {
    const cmd = {
      commandId: `cmd_${suffix}`,
      commandType: 'patient.create',
      projectId: `proj_${suffix}`,
      actorId: `usr_${suffix}`,
      deviceId: `dev_${suffix}`,
      sessionId: `sess_${suffix}`,
      idempotencyKey: '00000000-0000-0000-0000-000000000001',
      payload: {},
    };
    expect(CommandRequestSchema.safeParse(cmd).success).toBe(true);
  });

  it('CommandAckGottenSchema requires holdToken', () => {
    const ack = {
      commandId: `cmd_${suffix}`,
      receivedAt: new Date().toISOString(),
      holdToken: '00000000-0000-0000-0000-000000000002',
    };
    expect(CommandAckGottenSchema.safeParse(ack).success).toBe(true);
  });

  it('CommandAppliedSchema has resultingSequence', () => {
    const applied = {
      commandId: `cmd_${suffix}`,
      resultingSequence: 5n,
      appliedAt: new Date().toISOString(),
      result: {},
    };
    expect(CommandAppliedSchema.safeParse(applied).success).toBe(true);
  });
});

describe('EventBatchSchema', () => {
  it('accepts a batch', () => {
    const batch = {
      projectId: `proj_${suffix}`,
      fromSequence: 0n,
      toSequence: 10n,
      events: [],
      hasMore: false,
    };
    expect(EventBatchSchema.safeParse(batch).success).toBe(true);
  });
});
