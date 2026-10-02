import * as OTPAuth from "otpauth";

const ISSUER = "Product";
const DIGITS = 6;
const PERIOD = 30;
const ALGORITHM = "SHA1";
const SECRET_BYTES = 20; // 160-bit, RFC 4226 recommended

export interface TotpSetup {
  secret_base32: string;
  otpauth_url: string;
}

function makeTotp(secretBase32: string, accountName: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label: accountName,
    algorithm: ALGORITHM,
    digits: DIGITS,
    period: PERIOD,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
}

export function generateSetup(accountName: string): TotpSetup {
  const secret = new OTPAuth.Secret({ size: SECRET_BYTES });
  const totp = makeTotp(secret.base32, accountName);
  return {
    secret_base32: secret.base32,
    otpauth_url: totp.toString(),
  };
}

/// Verify a code against a stored secret. Returns true if the code matches
/// within a skew window of +/- 1 period (tolerates clock drift).
export function verifyCode(secretBase32: string, code: string): boolean {
  if (!secretBase32 || !code) return false;
  try {
    const totp = makeTotp(secretBase32, "");
    const delta = totp.validate({ token: code, window: 1 });
    return delta !== null;
  } catch {
    return false;
  }
}

/// Rebuild the otpauth URL for an existing secret (used to re-show the QR
/// code after an interrupted enable flow).
export function urlFor(secretBase32: string, accountName: string): string {
  return makeTotp(secretBase32, accountName).toString();
}