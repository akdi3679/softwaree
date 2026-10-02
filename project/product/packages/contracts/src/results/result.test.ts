import { describe, expect, it } from 'vitest';
import { err, ok, type Result } from './result';

describe('Result', () => {
  it('ok() creates a success result', () => {
    const r = ok(42);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toBe(42);
    }
  });

  it('err() creates a failure result', () => {
    const r = err(new Error('oops'));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.message).toBe('oops');
    }
  });

  it('narrows correctly on .ok', () => {
    const r: Result<number, string> = Math.random() > 0.5 ? ok(1) : err('nope');
    if (r.ok) {
      const right: number = r.value;
      expect(typeof right).toBe('number');
    } else {
      const right: string = r.error;
      expect(typeof right).toBe('string');
    }
  });
});
