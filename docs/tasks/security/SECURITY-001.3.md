# TASK ID: SECURITY-001.3
# TITLE: Add secrets redaction utility for logs
# STATUS: pending
# DEPENDENCIES: SECURITY-001.2
# ALLOWED FILES: platform-cloud/src/log/redact.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Redact secrets (passwords, tokens, keys) from log output.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/log/redact.ts`:

```typescript
const SECRET_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /password["']?\s*[:=]\s*["']?[^"'\s,}]+/gi, replacement: 'password=***' },
  { pattern: /token["']?\s*[:=]\s*["']?[^"'\s,}]+/gi, replacement: 'token=***' },
  { pattern: /authorization:\s*bearer\s+[a-zA-Z0-9._-]+/gi, replacement: 'authorization: bearer ***' },
  { pattern: /secret["']?\s*[:=]\s*["']?[^"'\s,}]+/gi, replacement: 'secret=***' },
  { pattern: /api[-_]?key["']?\s*[:=]\s*["']?[^"'\s,}]+/gi, replacement: 'api_key=***' },
  { pattern: /\b[A-Za-z0-9]{32,}\b/g, replacement: (m) => m.length > 32 ? m.slice(0, 8) + '***' : m },
];

export function redact(input: string): string {
  let out = input;
  for (const { pattern, replacement } of SECRET_PATTERNS) {
    if (typeof replacement === 'string') {
      out = out.replace(pattern, replacement);
    }
  }
  return out;
}

export function redactObject<T>(input: T): T {
  if (input == null) return input;
  if (typeof input === 'string') return redact(input) as unknown as T;
  if (Array.isArray(input)) return input.map(redactObject) as unknown as T;
  if (typeof input === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(input as object)) {
      const lowerK = k.toLowerCase();
      if (lowerK.includes('password') || lowerK.includes('token') || lowerK.includes('secret') || lowerK.includes('authorization')) {
        out[k] = '***';
      } else {
        out[k] = redactObject(v);
      }
    }
    return out as T;
  }
  return input;
}
```

Update `platform-cloud/src/log/logger.ts` to use redactor:

```typescript
import { redact, redactObject } from './redact';

export function log(level: 'info' | 'warn' | 'error', message: string, meta?: any) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message: redact(message),
    meta: meta ? redactObject(meta) : undefined,
  };
  console.log(JSON.stringify(entry));
}
```

## TESTS

```bash
cd platform-cloud
test -f src/log/redact.ts || { echo "FAIL"; exit 1; }
grep -q "password" src/log/redact.ts || { echo "FAIL"; exit 1; }
pnpm typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
