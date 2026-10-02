import { describe, expect, it } from 'vitest';
import { QueryEnvelopeSchema } from './index';

describe('QueryEnvelopeSchema', () => {
  it('rejects empty object', () => {
    const r = QueryEnvelopeSchema.safeParse({});
    expect(r.success).toBe(false);
  });

  it('does not require idempotency key', () => {
    const suffix = '0123456789abcdefghjkmn';
    const r = QueryEnvelopeSchema.safeParse({
      queryId: '00000000-0000-0000-0000-000000000001',
      queryType: 'patient.list',
      projectId: `proj_${suffix}`,
      actorId: `usr_${suffix}`,
      deviceId: `dev_${suffix}`,
      sessionId: `sess_${suffix}`,
      createdAt: new Date().toISOString(),
      payload: {},
    });
    expect(r.success).toBe(true);
  });
});
