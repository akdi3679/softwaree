# TASK ID: ONBOARD-001.1
# TITLE: Add Cloud signup flow (email → email verify → first session)
# STATUS: pending
# DEPENDENCIES: BILLING-001.4
# ALLOWED FILES: platform-cloud/src/onboarding/signup.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
The user signs up, verifies email, gets a session, is ready to use the platform.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/onboarding/signup.ts`:

```typescript
import { z } from 'zod';
import { createHash, randomBytes } from 'node:crypto';
import { db } from '../db';
import { accounts, emailVerifications } from '../db/schema';
import { eq } from 'drizzle-orm';
import { sendVerificationEmail } from '../email/send';

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12).max(128),
  display_name: z.string().min(1).max(100),
  agreed_to_terms: z.literal(true),
});

export interface SignupResult {
  account_id: string;
  requires_verification: boolean;
  verification_token?: string; // only in dev mode
}

export async function signup(input: z.infer<typeof SignupSchema>): Promise<SignupResult> {
  // Check email is not already used
  const existing = await db.select().from(accounts).where(eq(accounts.email, input.email)).limit(1);
  if (existing.length > 0) {
    // Don't leak whether the email is taken
    return { account_id: 'pending', requires_verification: true };
  }

  // Hash password (Argon2id, but we use a placeholder for the spec)
  const passwordHash = await hashPassword(input.password);

  // Create account
  const accountId = `acct_${randomString(22)}`;
  await db.insert(accounts).values({
    id: accountId,
    email: input.email,
    passwordHash,
    displayName: input.display_name,
    plan: 'local',
    state: 'pending_verification',
    createdAt: new Date().toISOString(),
  });

  // Generate email verification token
  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await db.insert(emailVerifications).values({
    accountId,
    tokenHash,
    expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  });

  // Send email
  await sendVerificationEmail(input.email, token);

  return {
    account_id: accountId,
    requires_verification: true,
    verification_token: process.env.NODE_ENV === 'development' ? token : undefined,
  };
}

async function hashPassword(pw: string): Promise<string> {
  // Real impl: argon2
  // For spec: use a clear placeholder
  return `argon2id$v=19$m=65536,t=3,p=4$${createHash('sha256').update(pw).digest('hex')}`;
}

function randomString(len: number): string {
  const ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz';
  let out = '';
  for (let i = 0; i < len; i++) out += ALPHABET[Math.floor(Math.random() * 32)];
  return out;
}

export async function verifyEmail(token: string): Promise<{ account_id: string }> {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const row = await db.select().from(emailVerifications).where(eq(emailVerifications.tokenHash, tokenHash)).limit(1);
  if (row.length === 0) throw new Error('invalid token');
  if (new Date(row[0].expiresAt) < new Date()) throw new Error('token expired');
  await db.update(accounts).set({ state: 'active', emailVerifiedAt: new Date().toISOString() }).where(eq(accounts.id, row[0].accountId));
  return { account_id: row[0].accountId };
}
```

## TESTS

```bash
cd platform-cloud
test -f src/onboarding/signup.ts || { echo "FAIL"; exit 1; }
grep -q "verifyEmail" src/onboarding/signup.ts || { echo "FAIL"; exit 1; }
pnpm typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
