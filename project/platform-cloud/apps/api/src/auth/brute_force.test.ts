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
import { clearOnSuccess, isLocked, recordFailedLogin } from './brute_force';

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

describe('recordFailedLogin', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a new lock row on first failure', async () => {
    mockDb.select.mockReturnValue(makeThenable([]));
    mockDb.insert.mockReturnValue(makeThenable([{ id: 'new' }]));
    const out = await recordFailedLogin('user@x', '1.2.3.4');
    expect(out.locked).toBe(false);
    expect(out.remaining).toBe(4);
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
  });

  it('increments failedCount below the threshold', async () => {
    mockDb.select.mockReturnValue(
      makeThenable([{ id: 'r1', failedCount: 2, lockedUntil: new Date(0) }]),
    );
    mockDb.update.mockReturnValue(makeThenable(undefined));
    const out = await recordFailedLogin('user@x', '1.2.3.4');
    expect(out.locked).toBe(false);
    expect(out.remaining).toBe(2);
  });

  it('locks at MAX_FAILS', async () => {
    mockDb.select.mockReturnValue(
      makeThenable([{ id: 'r1', failedCount: 4, lockedUntil: new Date(0) }]),
    );
    mockDb.update.mockReturnValue(makeThenable(undefined));
    const out = await recordFailedLogin('user@x', '1.2.3.4');
    expect(out.locked).toBe(true);
    expect(out.remaining).toBe(0);
  });
});

describe('isLocked', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns false when no row exists', async () => {
    mockDb.select.mockReturnValue(makeThenable([]));
    expect(await isLocked('user@x', '1.2.3.4')).toBe(false);
  });

  it('returns false when failedCount is below threshold', async () => {
    mockDb.select.mockReturnValue(
      makeThenable([
        { failedCount: 2, lockedUntil: new Date(Date.now() + 60_000) },
      ]),
    );
    expect(await isLocked('user@x', '1.2.3.4')).toBe(false);
  });

  it('returns true when failedCount meets threshold and lock is future', async () => {
    mockDb.select.mockReturnValue(
      makeThenable([
        { failedCount: 5, lockedUntil: new Date(Date.now() + 60_000) },
      ]),
    );
    expect(await isLocked('user@x', '1.2.3.4')).toBe(true);
  });

  it('returns false when lock has expired', async () => {
    mockDb.select.mockReturnValue(
      makeThenable([
        { failedCount: 5, lockedUntil: new Date(Date.now() - 60_000) },
      ]),
    );
    expect(await isLocked('user@x', '1.2.3.4')).toBe(false);
  });
});

describe('clearOnSuccess', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deletes the lock row', async () => {
    mockDb.delete.mockReturnValue(makeThenable(undefined));
    await clearOnSuccess('user@x', '1.2.3.4');
    expect(mockDb.delete).toHaveBeenCalledTimes(1);
  });
});