# TASK ID: CLOUD-007.5
# TITLE: Add crypto unit tests
# STATUS: pending
# DEPENDENCIES: CLOUD-007.4
# ALLOWED FILES: platform-cloud/apps/api/src/crypto/crypto.test.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Add unit tests for password hashing, keypair generation, and challenge generation.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/apps/api/src/crypto/crypto.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { generateKeypair, signMessage, verifySignature } from './device-key';
import { constantTimeEqual, generateChallenge, hashToken } from './challenge';
import { hashPassword, verifyPassword } from './password';

describe('password', () => {
  it('hashes and verifies a password', async () => {
    const h = await hashPassword('correct horse battery staple');
    expect(h).toMatch(/^\$argon2id\$/);
    expect(await verifyPassword('correct horse battery staple', h)).toBe(true);
    expect(await verifyPassword('wrong password', h)).toBe(false);
  });

  it('rejects short passwords', async () => {
    await expect(hashPassword('short')).rejects.toThrow();
  });
});

describe('device key', () => {
  it('roundtrips sign/verify', () => {
    const { privateKey, publicKey } = generateKeypair();
    const message = new TextEncoder().encode('hello');
    const sig = signMessage(privateKey, message);
    expect(verifySignature(publicKey, message, sig)).toBe(true);
    expect(verifySignature(publicKey, new TextEncoder().encode('other'), sig)).toBe(false);
  });
});

describe('challenge', () => {
  it('generates unique challenges', () => {
    const a = generateChallenge();
    const b = generateChallenge();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(40); // base64 of 32 bytes
  });

  it('constantTimeEqual matches', () => {
    expect(constantTimeEqual('abc', 'abc')).toBe(true);
    expect(constantTimeEqual('abc', 'abd')).toBe(false);
    expect(constantTimeEqual('abc', 'abcd')).toBe(false);
  });

  it('hashToken is deterministic', () => {
    expect(hashToken('foo')).toBe(hashToken('foo'));
    expect(hashToken('foo')).not.toBe(hashToken('bar'));
  });
});
```

## TESTS

```bash
cd platform-cloud
test -f apps/api/src/crypto/crypto.test.ts || { echo "FAIL"; exit 1; }
pnpm --filter @cloud/api test > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
