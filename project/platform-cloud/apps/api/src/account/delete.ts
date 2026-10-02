import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { accounts } from '../db/schema';

const GRACE_MS = 30 * 24 * 60 * 60 * 1000;

export async function requestAccountDeletion(accountId: string) {
  const until = new Date(Date.now() + GRACE_MS);
  await db
    .update(accounts)
    .set({ status: 'pending_deletion', updatedAt: new Date() })
    .where(eq(accounts.id, accountId));
  return { scheduledFor: until.toISOString() };
}

export async function cancelAccountDeletion(accountId: string) {
  const rows = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
  const account = rows[0];
  if (!account || account.status !== 'pending_deletion') {
    return { cancelled: false };
  }
  await db.update(accounts).set({ status: 'active', updatedAt: new Date() }).where(eq(accounts.id, accountId));
  return { cancelled: true };
}

export async function processDueDeletions() {
  // For now, no-op placeholder: actual hard-delete cascade will be implemented later.
  return { deleted: 0 };
}
