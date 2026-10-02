import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';

export function generateChallenge(): string {
  return randomBytes(32).toString('base64url');
}

export function constantTimeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
