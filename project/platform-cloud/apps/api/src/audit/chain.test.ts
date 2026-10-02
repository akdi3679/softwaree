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
import { GENESIS_HASH, verifyChain } from './chain';

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

describe('verifyChain', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns valid for an empty chain', async () => {
    mockDb.select.mockReturnValue(makeThenable([]));
    const out = await verifyChain();
    expect(out.validCount).toBe(0);
    expect(out.totalCount).toBe(0);
    expect(out.brokenAt).toBeNull();
  });

  it('returns invalid when the first row does not chain from genesis', async () => {
    mockDb.select.mockReturnValue(
      makeThenable([{ id: 'row-1', prevHash: 'deadbeef', entryHash: 'whatever' }]),
    );
    const out = await verifyChain();
    expect(out.brokenAt).toBe('row-1');
  });

  it('detects a broken chain at the second entry', async () => {
    mockDb.select.mockReturnValue(
      makeThenable([
        { id: 'row-1', prevHash: GENESIS_HASH, entryHash: 'h1' },
        { id: 'row-2', prevHash: 'not-h1', entryHash: 'h2' },
      ]),
    );
    const out = await verifyChain();
    expect(out.brokenAt).toBe('row-2');
  });
});