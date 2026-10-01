# TASK ID: SECURITY-006.1
# TITLE: Add security: brute-force protection for cloud login
# STATUS: pending
# DEPENDENCIES: SYNC-005.2
# ALLOWED FILES: platform-cloud/src/auth/brute_force.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Lock account after 5 failed logins in 15 minutes.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/auth/brute_force.ts`:

```typescript
import { db } from '../db';

const MAX_FAILS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 30 * 60 * 1000; // 30 min lockout

export async function recordFailedLogin(email: string, ip: string) {
  const key = `failed_login:${email}:${ip}`;
  // In-memory map for v1; switch to Redis at Stage 2+
  const cur = (global as any)[key] ?? { count: 0, first_at: Date.now() };
  cur.count++;
  (global as any)[key] = cur;
  if (cur.count >= MAX_FAILS) {
    const until = new Date(Date.now() + LOCK_MS).toISOString();
    await db('account_locks').insert({ email, ip, until }).onConflict(['email', 'ip']).merge();
    return { locked: true, until };
  }
  return { locked: false, remaining: MAX_FAILS - cur.count };
}

export async function isLocked(email: string, ip: string): Promise<boolean> {
  const lock = await db('account_locks').where({ email, ip }).first();
  if (!lock) return false;
  if (new Date(lock.until) < new Date()) {
    await db('account_locks').where({ email, ip }).del();
    return false;
  }
  return true;
}

export async function clearOnSuccess(email: string, ip: string) {
  delete (global as any)[`failed_login:${email}:${ip}`];
  await db('account_locks').where({ email, ip }).del();
}
```

Add migration `add_account_locks.sql`:
```sql
CREATE TABLE IF NOT EXISTS account_locks (
  email TEXT NOT NULL,
  ip TEXT NOT NULL,
  until TEXT NOT NULL,
  PRIMARY KEY (email, ip)
);
```

## TESTS

```bash
cd platform-cloud
test -f src/auth/brute_force.ts || { echo "FAIL"; exit 1; }
grep -q "recordFailedLogin" src/auth/brute_force.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
