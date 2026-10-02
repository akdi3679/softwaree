import { ed25519 } from '@noble/curves/ed25519';
import { sha256 } from '@noble/hashes/sha2';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils';

export interface DeviceKey {
  publicKey: string;
}

export function generateKeypair(): { privateKey: string; publicKey: string } {
  const secret = ed25519.utils.randomPrivateKey();
  const publicKey = ed25519.getPublicKey(secret);
  return {
    privateKey: bytesToHex(secret),
    publicKey: bytesToHex(publicKey),
  };
}

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

export function signMessage(privateKeyHex: string, message: Uint8Array): string {
  return bytesToHex(ed25519.sign(message, hexToBytes(privateKeyHex)));
}

export function sha256Hex(data: Uint8Array): string {
  return bytesToHex(sha256(data));
}

export { utf8ToBytes };
