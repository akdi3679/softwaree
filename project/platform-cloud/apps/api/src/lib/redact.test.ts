import { describe, expect, it } from 'vitest';
import { redact, redactObject } from './redact';

describe('redact (string)', () => {
  it('scrubs password values', () => {
    expect(redact('user=alice password=hunter2 rest')).not.toContain('hunter2');
  });

  it('scrubs token values', () => {
    expect(redact('token=abc123 more')).not.toContain('abc123');
  });

  it('scrubs Stripe secret keys', () => {
    const input = 'key=sk_test_' + 'x'.repeat(30);
    expect(redact(input)).toContain('sk_***');
  });

  it('scrubs authorization bearer headers', () => {
    expect(redact('authorization: bearer eyJhbGc123')).toContain('***');
  });

  it('leaves benign text alone', () => {
    expect(redact('hello world')).toBe('hello world');
  });
});

describe('redactObject', () => {
  it('redacts sensitive keys', () => {
    const out = redactObject({ user: 'alice', password: 'secret' });
    expect(out).toEqual({ user: 'alice', password: '***' });
  });

  it('redacts nested objects', () => {
    const out = redactObject({ outer: { token: 'abc', ok: 1 } }) as {
      outer: { token: string; ok: number };
    };
    expect(out.outer.token).toBe('***');
    expect(out.outer.ok).toBe(1);
  });

  it('recurses into arrays', () => {
    const out = redactObject([{ password: 'a' }, { password: 'b' }]);
    expect(out).toEqual([{ password: '***' }, { password: '***' }]);
  });

  it('handles null and undefined', () => {
    expect(redactObject(null)).toBeNull();
    expect(redactObject(undefined)).toBeUndefined();
  });

  it('is case-insensitive on sensitive keys', () => {
    const out = redactObject({ PASSWORD: 'secret' });
    expect(out).toEqual({ PASSWORD: '***' });
  });
});