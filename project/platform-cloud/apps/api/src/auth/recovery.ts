import { randomBytes } from 'node:crypto';
import { db } from '../db/client';
import { accounts } from '../db/schema';
import { eq } from 'drizzle-orm';

// Placeholder recovery tokens are not stored persistently in v1.
// This module provides the interface for future implementation.

export async function requestRecovery(email: string) {
  const rows = await db.select().from(accounts).where(eq(accounts.email, email)).limit(1);
  if (rows.length === 0) {
    return { sent: true }; // don't reveal existence
  }
  const token = randomBytes(32).toString('hex');
  // In production, store hashed token in a recovery_tokens table with expiry.
  return { sent: true, debugToken: token }; // debugToken only for tests; remove later
}

export async function completeRecovery(token: string, newPasswordHash: string) {
  // Placeholder: verify token, set new password hash.
  return { ok: false, reason: 'not_implemented' };
}
