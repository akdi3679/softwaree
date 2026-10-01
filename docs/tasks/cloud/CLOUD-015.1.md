# TASK ID: CLOUD-015.1
# TITLE: Add Cloud: account recovery (email + lost device)
# STATUS: pending
# DEPENDENCIES: ARCH-008.2
# ALLOWED FILES: platform-cloud/src/auth/recovery.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
If user loses their device and TOTP, they can recover via support + ID verification.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/auth/recovery.ts`:

```typescript
import { db } from '../db';
import { sendEmail } from '../email/sender';
import { randomBytes } from 'crypto';

export async function requestRecovery(email: string) {
  const account = await db('accounts').where({ email }).first();
  if (!account) {
    // Don't reveal whether email exists
    return { sent: true };
  }
  const token = randomBytes(32).toString('hex');
  const expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
  await db('recovery_tokens').insert({ email, token, expires_at });
  await sendEmail(email, 'Account recovery',
    `Use this link within 1 hour to start account recovery: ` +
    `https://portal.example.com/recovery?token=${token}`);
  return { sent: true };
}

export async function completeRecovery(token: string, new_password_hash: string) {
  const rec = await db('recovery_tokens').where({ token }).first();
  if (!rec) return { ok: false, reason: 'invalid' };
  if (new Date(rec.expires_at) < new Date()) return { ok: false, reason: 'expired' };
  await db('accounts').where({ email: rec.email }).update({ password_hash: new_password_hash });
  await db('recovery_tokens').where({ token }).del();
  // Revoke all sessions
  await db('account_sessions').where({ account_id: (await db('accounts').where({ email: rec.email }).first()).id }).del();
  // Revoke all devices (they need to be re-authorized)
  // Actually, no — we don't know which account the devices belong to, that's only known to Admin. Just delete sessions.
  return { ok: true };
}
```

## TESTS

```bash
cd platform-cloud
test -f src/auth/recovery.ts || { echo "FAIL"; exit 1; }
grep -q "requestRecovery" src/auth/recovery.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
