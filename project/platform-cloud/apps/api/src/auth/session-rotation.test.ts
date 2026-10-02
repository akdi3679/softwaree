import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../db/client', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { db } from '../db/client';
import { isSessionValid, rotateUserSessions } from './session-rotation';

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

function makeThenable(resolved: unknown): unknown {
  const p = Promise.resolve(resolved);
  const chain: Record<string, unknown> = {
    from: () => chain,
    where: () => chain,
    orderBy: () => chain,
    limit: () => p,
    values: () => p,
    set: () => chain,
    returning: () => p,
    then: p.then.bind(p),
    catch: p.catch.bind(p),
  };
  return chain;
}

describe('rotateUserSessions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 0 when the user has no active sessions', async () => {
    mockDb.select.mockReturnValue(makeThenable([]));
    const out = await rotateUserSessions('user-1');
    expect(out.revoked).toBe(0);
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it('revokes every active session for the user', async () => {
    mockDb.select.mockReturnValue(
      makeThenable([
        { id: 'r1', sessionId: 's1' },
        { id: 'r2', sessionId: 's2' },
      ]),
    );
    mockDb.update.mockReturnValue(makeThenable(undefined));
    const out = await rotateUserSessions('user-1');
    expect(out.revoked).toBe(2);
    expect(mockDb.update).toHaveBeenCalledTimes(2);
  });

  it('skips the exceptSessionId', async () => {
    mockDb.select.mockReturnValue(
      makeThenable([
        { id: 'r1', sessionId: 'keep' },
        { id: 'r2', sessionId: 'kill' },
      ]),
    );
    mockDb.update.mockReturnValue(makeThenable(undefined));
    const out = await rotateUserSessions('user-1', 'keep');
    expect(out.revoked).toBe(1);
  });
});

describe('isSessionValid', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns false for a nonexistent session', async () => {
    mockDb.select.mockReturnValue(makeThenable([]));
    expect(await isSessionValid('nope')).toBe(false);
  });

  it('returns false for a revoked session', async () => {
    mockDb.select.mockReturnValue(
      makeThenable([
        {
          isRevoked: 'true',
          revokedAt: new Date(),
          expiresAt: new Date(Date.now() + 60_000),
        },
      ]),
    );
    expect(await isSessionValid('s1')).toBe(false);
  });

  it('returns false for an expired session', async () => {
    mockDb.select.mockReturnValue(
      makeThenable([
        {
          isRevoked: 'false',
          revokedAt: null,
          expiresAt: new Date(Date.now() - 60_000),
        },
      ]),
    );
    expect(await isSessionValid('s1')).toBe(false);
  });

  it('returns true for a valid session', async () => {
    mockDb.select.mockReturnValue(
      makeThenable([
        {
          isRevoked: 'false',
          revokedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
        },
      ]),
    );
    expect(await isSessionValid('s1')).toBe(true);
  });
});