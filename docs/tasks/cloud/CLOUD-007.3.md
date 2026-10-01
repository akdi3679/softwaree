# TASK ID: CLOUD-007.3
# TITLE: Create device key verification module
# STATUS: pending
# DEPENDENCIES: CLOUD-007.2
# ALLOWED FILES: platform-cloud/apps/api/src/crypto/device-key.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Create the device-key module — verify Ed25519 signatures from devices.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/apps/api/src/crypto/device-key.ts`:

```typescript
import { ed25519 } from '@noble/curves/ed25519';
import { sha256 } from '@noble/hashes/sha2';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils';

export interface DeviceKey {
  publicKey: string; // base64
}

/**
 * Generate an Ed25519 keypair. Returns hex-encoded private + public.
 * Used by the test suite and the dev-time device factory. Production
 * devices generate their own keys locally and only the public key is sent.
 */
export function generateKeypair(): { privateKey: string; publicKey: string } {
  const secret = ed25519.utils.randomPrivateKey();
  const publicKey = ed25519.getPublicKey(secret);
  return {
    privateKey: bytesToHex(secret),
    publicKey: bytesToHex(publicKey),
  };
}

/**
 * Verify an Ed25519 signature over a message.
 * Public key is hex; signature is hex; message is bytes.
 */
export function verifySignature(
  publicKeyHex: string,
  message: Uint8Array,
  signatureHex: string,
): boolean {
  try {
    return ed25519.verify(signatureHex, message, hexToBytes(publicKeyHex));
  } catch {
    return false;
  }
}

/**
 * Sign a message with a private key (hex). Used in tests and dev tools.
 */
export function signMessage(privateKeyHex: string, message: Uint8Array): string {
  return bytesToHex(ed25519.sign(message, hexToBytes(privateKeyHex)));
}

/**
 * Hash data with SHA-256.
 */
export function sha256Hex(data: Uint8Array): string {
  return bytesToHex(sha256(data));
}

export { utf8ToBytes };
```

## TESTS

```bash
cd platform-cloud
test -f apps/api/src/crypto/device-key.ts || { echo "FAIL"; exit 1; }
grep -q "verifySignature" apps/api/src/crypto/device-key.ts || { echo "FAIL"; exit 1; }
pnpm --filter @cloud/api typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
