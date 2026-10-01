# TASK ID: SECURITY-003.1
# TITLE: Add Argon2id password hash verifier
# STATUS: pending
# DEPENDENCIES: FOODLAB-004.3
# ALLOWED FILES: platform-cloud/src/auth/argon2.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Argon2id password hashing with parameters 64MB, t=3, p=4.

## REQUIRED IMPLEMENTATION

Add to `package.json`:
```json
"dependencies": {
  "argon2": "^0.41.1"
}
```

Create `platform-cloud/src/auth/argon2.ts`:

```typescript
import * as argon2 from 'argon2';

const PARAMS = {
  memoryCost: 64 * 1024, // 64 MB
  timeCost: 3,
  parallelism: 4,
  type: argon2.argon2id,
};

export async function hash(password: string): Promise<string> {
  return await argon2.hash(password, PARAMS);
}

export async function verify(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

export function needsRehash(hash: string): boolean {
  return argon2.needsRehash(hash, PARAMS);
}
```

## TESTS

```bash
cd platform-cloud
test -f src/auth/argon2.ts || { echo "FAIL"; exit 1; }
grep -q "argon2id" src/auth/argon2.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
