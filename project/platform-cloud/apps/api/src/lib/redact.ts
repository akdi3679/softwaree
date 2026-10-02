//! Redact secrets from log output.
//!
//! Two modes:
//!  - redact(string): scrub known patterns
//!  - redactObject(unknown): recursive, key-aware scrub

const PATTERNS: Array<[RegExp, string]> = [
  [/password["\s]*[:=]["\s]*[^"\s,}]+/gi, 'password=***'],
  [/token["\s]*[:=]["\s]*[^"\s,}]+/gi, 'token=***'],
  [/secret["\s]*[:=]["\s]*[^"\s,}]+/gi, 'secret=***'],
  [/api[-_]?key["\s]*[:=]["\s]*[^"\s,}]+/gi, 'api_key=***'],
  [/authorization:\s*bearer\s+[A-Za-z0-9._-]+/gi, 'authorization: bearer ***'],
  [/sk_(?:live|test)_[A-Za-z0-9]{24,}/g, 'sk_***'],
];

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'password_hash',
  'token',
  'refreshtoken',
  'refresh_token',
  'refreshtokenhash',
  'refresh_token_hash',
  'secret',
  'apikey',
  'api_key',
  'authorization',
  'privatekey',
  'private_key',
  'signingkey',
  'signing_key',
]);

export function redact(input: string): string {
  let out = input;
  for (const [pattern, replacement] of PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

export function redactObject<T>(input: T): T {
  if (input == null) return input;
  if (typeof input === 'string') return redact(input) as unknown as T;
  if (Array.isArray(input)) return input.map(redactObject) as unknown as T;
  if (typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k.toLowerCase())) {
        out[k] = '***';
      } else {
        out[k] = redactObject(v);
      }
    }
    return out as T;
  }
  return input;
}
