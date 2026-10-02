import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { accounts, users } from '../db/schema';
import { hashPassword } from '../crypto/password';
import { HttpError } from '../middleware/error';
import { ErrorCategory } from '@product/contracts';

export async function signup(email: string, password: string, displayName: string) {
  const existing = await db.select().from(accounts).where(eq(accounts.email, email)).limit(1);
  if (existing.length > 0) {
    throw new HttpError(409, ErrorCategory.CONFLICT, 'ACCOUNT_EXISTS', 'Email already registered');
  }
  const passwordHash = await hashPassword(password);
  const [account] = await db.insert(accounts).values({
    primaryUserId: '',
    email,
    displayName,
    passwordHash,
    status: 'active',
  }).returning();
  if (!account) throw new Error('account insert failed');

  const [user] = await db.insert(users).values({
    accountId: account.id,
    email,
    displayName,
  }).returning();
  if (!user) throw new Error('user insert failed');

  await db.update(accounts).set({ primaryUserId: user.id }).where(eq(accounts.id, account.id));
  return { accountId: account.id, userId: user.id };
}
// ---------------------------------------------------------------------------
// Login: verifies credentials, enforces brute-force lockout, creates a session.
//
// - Refuses if the (email, ip) pair is currently locked (429).
// - On failure (unknown account, no password, or wrong password): records the
//   failure and returns 401 with a uniform error message.
// - On success: clears the lock and inserts a sessions row.
// ---------------------------------------------------------------------------
import { randomBytes, randomUUID } from 'node:crypto';
import { sessions } from '../db/schema';
import { verifyPassword } from '../crypto/password';
import { clearOnSuccess, isLocked, recordFailedLogin } from '../auth/brute_force';
import { verifyCode } from './totp';

export interface LoginResult {
  sessionId: string;
  userId: string;
  accountId: string;
  expiresAt: Date;
}

export async function login(
  email: string,
  password: string,
  ip: string,
  deviceId?: string,
  totpCode?: string,
): Promise<LoginResult> {
  if (await isLocked(email, ip)) {
    throw new HttpError(
      429,
      ErrorCategory.PERMANENT,
      'ACCOUNT_LOCKED',
      'Too many failed attempts. Try again later.',
    );
  }

  const accountRows = await db
    .select()
    .from(accounts)
    .where(eq(accounts.email, email))
    .limit(1);
  const account = accountRows[0];

  if (!account || !account.passwordHash) {
    await recordFailedLogin(email, ip);
    throw new HttpError(
      401,
      ErrorCategory.PERMANENT,
      'INVALID_CREDENTIALS',
      'Invalid email or password',
    );
  }

  const ok = await verifyPassword(password, account.passwordHash);
  if (!ok) {
    await recordFailedLogin(email, ip);
    throw new HttpError(
      401,
      ErrorCategory.PERMANENT,
      'INVALID_CREDENTIALS',
      'Invalid email or password',
    );
  }

  // Second factor: if TOTP is enabled on this account, require a valid code.
  if (account.totpEnabledAt && account.totpSecret) {
    if (!totpCode) {
      throw new HttpError(
        401,
        ErrorCategory.PERMANENT,
        'TOTP_REQUIRED',
        'Two-factor authentication code required',
      );
    }
    if (!verifyCode(account.totpSecret, totpCode)) {
      await recordFailedLogin(email, ip);
      throw new HttpError(
        401,
        ErrorCategory.PERMANENT,
        'INVALID_TOTP',
        'Invalid two-factor authentication code',
      );
    }
  }

  await clearOnSuccess(email, ip);

  const sessionId = randomBytes(24).toString('hex');
  const refreshTokenHash = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    sessionId,
    userId: account.primaryUserId,
    deviceId: deviceId ?? randomUUID(),
    refreshTokenHash,
    expiresAt,
  });

  return {
    sessionId,
    userId: account.primaryUserId,
    accountId: account.id,
    expiresAt,
  };
}
