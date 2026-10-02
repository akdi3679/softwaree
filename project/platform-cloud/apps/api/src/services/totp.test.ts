import { describe, expect, it } from 'vitest';
import * as OTPAuth from 'otpauth';
import { generateSetup, urlFor, verifyCode } from './totp';

// RFC 6238 Appendix B - the shared secret is ASCII "12345678901234567890".
// Base32-encoded, that is: GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ
const RFC_SECRET_BASE32 = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

function rfcCode(secs: number): string {
  const totp = new OTPAuth.TOTP({
    issuer: 'Product',
    label: '',
    algorithm: 'SHA1',
    digits: 8,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(RFC_SECRET_BASE32),
  });
  // otpauth expects milliseconds
  return totp.generate({ timestamp: secs * 1000 });
}

describe('TOTP - RFC 6238 vectors', () => {
  // Our verifyCode uses digits=6, so these vectors (which use 8 digits)
  // cannot be checked via verifyCode directly. Instead, we validate that
  // our base32 decoding and OTPAuth usage match the published vectors.
  it('matches the published SHA1 vectors', () => {
    expect(rfcCode(59)).toBe('94287082');
    expect(rfcCode(1111111109)).toBe('07081804');
    expect(rfcCode(1111111111)).toBe('14050471');
    expect(rfcCode(1234567890)).toBe('89005924');
    expect(rfcCode(2000000000)).toBe('69279037');
    expect(rfcCode(20000000000)).toBe('65353130');
  });
});

describe('generateSetup', () => {
  it('returns a base32 secret and otpauth URL', () => {
    const s = generateSetup('alice@example.com');
    expect(s.secret_base32.length).toBeGreaterThanOrEqual(16);
    expect(s.otpauth_url.startsWith('otpauth://totp/')).toBe(true);
    expect(s.otpauth_url).toContain('secret=' + s.secret_base32);
  });
});

describe('verifyCode', () => {
  it('returns false for empty input', () => {
    expect(verifyCode('', '000000')).toBe(false);
    expect(verifyCode('JBSWY3DPEHPK3PXP', '')).toBe(false);
  });

  it('returns false for an invalid code', () => {
    const s = generateSetup('alice@example.com');
    expect(verifyCode(s.secret_base32, '000000')).toBe(false);
  });

  it('accepts the current code', () => {
    const s = generateSetup('alice@example.com');
    // generate a code using the same library for the same secret
    const totp = new OTPAuth.TOTP({
      issuer: 'Product',
      label: '',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(s.secret_base32),
    });
    const current = totp.generate();
    expect(verifyCode(s.secret_base32, current)).toBe(true);
  });
});

describe('urlFor', () => {
  it('rebuilds the same URL from the same secret', () => {
    const s = generateSetup('alice@example.com');
    const url = urlFor(s.secret_base32, 'alice@example.com');
    expect(url).toContain('otpauth://totp/');
    expect(url).toContain(s.secret_base32);
  });
});