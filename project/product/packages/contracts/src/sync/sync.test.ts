import { describe, expect, it } from 'vitest';
import { SyncHelloSchema, SyncRequestSchema, SyncResponseSchema } from './index';

const suffix = '0123456789abcdefghjkmn';

describe('SyncHelloSchema', () => {
  it('accepts valid hello', () => {
    const hello = {
      protocolVersion: 1,
      projectId: `proj_${suffix}`,
      userId: `usr_${suffix}`,
      deviceId: `dev_${suffix}`,
      sessionId: `sess_${suffix}`,
      lastAppliedSequence: 0n,
      schemaVersion: '1.0',
      projectionFormatVersion: 1,
      clientCapabilities: [],
    };
    expect(SyncHelloSchema.safeParse(hello).success).toBe(true);
  });
  it('rejects wrong protocol version', () => {
    const hello = {
      protocolVersion: 99,
      projectId: `proj_${suffix}`,
      userId: `usr_${suffix}`,
      deviceId: `dev_${suffix}`,
      sessionId: `sess_${suffix}`,
      lastAppliedSequence: 0n,
      schemaVersion: '1.0',
      projectionFormatVersion: 1,
    };
    expect(SyncHelloSchema.safeParse(hello).success).toBe(false);
  });
});

describe('SyncRequestSchema', () => {
  it('requires non-negative lastAppliedSequence', () => {
    const req = {
      projectId: `proj_${suffix}`,
      lastAppliedSequence: -1n,
      maxEvents: 100,
      requestedProjectionFormatVersion: 1,
    };
    expect(SyncRequestSchema.safeParse(req).success).toBe(false);
  });
});

describe('SyncResponseSchema', () => {
  it('accepts events mode', () => {
    const res = {
      mode: 'events',
      projectId: `proj_${suffix}`,
      fromSequence: 0n,
      toSequence: 10n,
      events: [],
      hasMore: false,
    };
    expect(SyncResponseSchema.safeParse(res).success).toBe(true);
  });
  it('accepts snapshot mode', () => {
    const res = {
      mode: 'snapshot',
      projectId: `proj_${suffix}`,
      atSequence: 100n,
      snapshot: {},
      projectionFormatVersion: 1,
    };
    expect(SyncResponseSchema.safeParse(res).success).toBe(true);
  });
});
