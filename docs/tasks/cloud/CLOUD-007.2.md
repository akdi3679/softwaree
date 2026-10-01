# TASK ID: CLOUD-007.2
# TITLE: Create password hashing module
# STATUS: pending
# DEPENDENCIES: CLOUD-007.1
# ALLOWED FILES: platform-cloud/apps/api/src/crypto/password.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Create the password hashing module using Argon2id with high memory cost.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/apps/api/src/crypto/password.ts`:

```typescript
import { hash, verify, Algorithm } from '@node-rs/argon2';

// OWASP-recommended Argon2id parameters (2024)
const ARGON2_OPTS = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,
  parallelism: 4,
};

export async function hashPassword(plain: string): Promise<string> {
  if (plain.length < 12) {
    throw new Error('Password must be at least 12 characters');
  }
  return hash(plain, ARGON2_OPTS);
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  try {
    return await verify(stored, plain);
  } catch {
    return false;
  }
}
```

## TESTS

```bash
cd platform-cloud
test -f apps/api/src/crypto/password.ts || { echo "FAIL"; exit 1; }
grep -q "hashPassword" apps/api/src/crypto/password.ts || { echo "FAIL"; exit 1; }
grep -q "verifyPassword" apps/api/src/crypto/password.ts || { echo "FAIL"; exit 1; }
pnpm --filter @cloud/api typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
