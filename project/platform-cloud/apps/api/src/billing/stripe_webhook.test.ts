import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock setup
//
// stripe.ts reads STRIPE_SECRET_KEY at MODULE LOAD time and constructs a
// real Stripe client if the key is non-empty. To exercise handleWebhook
// without a live account, we:
//   1. Mock the "stripe" package so `new Stripe(...)` returns a fake.
//   2. Mock ../db/client so the Drizzle update chain is spyable.
//   3. Set env, then dynamic-import ./stripe inside beforeAll.
// ---------------------------------------------------------------------------

const mockState = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
  where: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('stripe', () => ({
  default: class MockStripe {
    webhooks = { constructEvent: mockState.constructEvent };
    checkout = { sessions: { create: vi.fn() } };
    subscriptions = { cancel: vi.fn() };
    billingPortal = { sessions: { create: vi.fn() } };
  },
}));

vi.mock('../db/client', () => ({
  db: {
    update: (...args: unknown[]) => {
      mockState.update(...args);
      return {
        set: (obj: unknown) => {
          mockState.set(obj);
          return {
            where: (...w: unknown[]) => mockState.where(...w),
          };
        },
      };
    },
    select: vi.fn(),
  },
}));

type HandleWebhook = (
  rawBody: Buffer,
  signature: string,
) => Promise<{ type: string; handled: boolean }>;

let handleWebhook: HandleWebhook;

beforeAll(async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_fake';
  const mod = await import('./stripe');
  handleWebhook = mod.handleWebhook as unknown as HandleWebhook;
}, 60_000);

beforeEach(() => {
  mockState.constructEvent.mockReset();
  mockState.update.mockReset();
  mockState.set.mockReset();
  mockState.where.mockClear();
  mockState.where.mockResolvedValue(undefined);
});

describe('handleWebhook', () => {
  it('rejects an invalid signature', async () => {
    mockState.constructEvent.mockImplementation(() => {
      throw new Error('bad sig');
    });
    await expect(
      handleWebhook(Buffer.from('{}'), 'bad-signature'),
    ).rejects.toThrow(/webhook signature invalid/);
    expect(mockState.update).not.toHaveBeenCalled();
  });

  it('handles customer.subscription.created by updating planRenewsAt', async () => {
    mockState.constructEvent.mockReturnValue({
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_123',
          metadata: { accountId: 'acc-1', plan: 'team' },
          current_period_end: 1735689600,
        },
      },
    });

    const result = await handleWebhook(Buffer.from('{}'), 'sig');
    expect(result).toEqual({
      type: 'customer.subscription.created',
      handled: true,
    });
    expect(mockState.update).toHaveBeenCalledTimes(1);
    expect(mockState.set).toHaveBeenCalledWith(
      expect.objectContaining({
        planRenewsAt: expect.any(Date),
      }),
    );
  });

  it('handles customer.subscription.updated the same way', async () => {
    mockState.constructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_123',
          metadata: { accountId: 'acc-1' },
          current_period_end: 1735689600,
        },
      },
    });

    const result = await handleWebhook(Buffer.from('{}'), 'sig');
    expect(result).toEqual({
      type: 'customer.subscription.updated',
      handled: true,
    });
    expect(mockState.set).toHaveBeenCalledWith(
      expect.objectContaining({ planRenewsAt: expect.any(Date) }),
    );
  });

  it('handles customer.subscription.deleted by downgrading to local', async () => {
    mockState.constructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_123',
          metadata: { accountId: 'acc-1' },
        },
      },
    });

    const result = await handleWebhook(Buffer.from('{}'), 'sig');
    expect(result).toEqual({
      type: 'customer.subscription.deleted',
      handled: true,
    });
    expect(mockState.set).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: 'local',
        planRenewsAt: null,
        stripeSubscriptionId: null,
      }),
    );
  });

  it('ignores unknown event types without touching the DB', async () => {
    mockState.constructEvent.mockReturnValue({
      type: 'invoice.payment_succeeded',
      data: { object: {} },
    });

    const result = await handleWebhook(Buffer.from('{}'), 'sig');
    expect(result).toEqual({
      type: 'invoice.payment_succeeded',
      handled: false,
    });
    expect(mockState.update).not.toHaveBeenCalled();
  });

  it('skips the DB update when metadata.accountId is missing', async () => {
    mockState.constructEvent.mockReturnValue({
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_123',
          metadata: {},
          current_period_end: 0,
        },
      },
    });

    const result = await handleWebhook(Buffer.from('{}'), 'sig');
    expect(result).toEqual({
      type: 'customer.subscription.created',
      handled: true,
    });
    expect(mockState.update).not.toHaveBeenCalled();
  });

  it('passes the raw body and signature through to constructEvent', async () => {
    mockState.constructEvent.mockReturnValue({
      type: 'ping',
      data: { object: {} },
    });
    const raw = Buffer.from('{"hello":"world"}');
    await handleWebhook(raw, 'test-sig');
    expect(mockState.constructEvent).toHaveBeenCalledWith(
      raw,
      'test-sig',
      expect.any(String),
    );
  });
});