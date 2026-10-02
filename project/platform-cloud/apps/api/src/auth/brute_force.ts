import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { accountLocks } from "../db/account-locks";

const MAX_FAILS = 5;
const LOCK_MS = 30 * 60 * 1000;

export async function recordFailedLogin(email: string, ip: string) {
  const existing = await db
    .select()
    .from(accountLocks)
    .where(and(eq(accountLocks.email, email), eq(accountLocks.ip, ip)))
    .limit(1);

  const cur = existing[0];
  if (!cur) {
    await db.insert(accountLocks).values({
      email,
      ip,
      failedCount: 1,
      lockedUntil: new Date(Date.now() + LOCK_MS),
    });
    return { locked: false, remaining: MAX_FAILS - 1 };
  }

  const next = cur.failedCount + 1;
  const locked = next >= MAX_FAILS;
  await db
    .update(accountLocks)
    .set({
      failedCount: next,
      lockedUntil: locked ? new Date(Date.now() + LOCK_MS) : cur.lockedUntil,
      updatedAt: new Date(),
    })
    .where(eq(accountLocks.id, cur.id));

  return {
    locked,
    remaining: locked ? 0 : MAX_FAILS - next,
  };
}

export async function isLocked(email: string, ip: string): Promise<boolean> {
  const rows = await db
    .select({ lockedUntil: accountLocks.lockedUntil, failedCount: accountLocks.failedCount })
    .from(accountLocks)
    .where(and(eq(accountLocks.email, email), eq(accountLocks.ip, ip)))
    .limit(1);
  const row = rows[0];
  if (!row) return false;
  if (row.failedCount < MAX_FAILS) return false;
  return row.lockedUntil.getTime() > Date.now();
}

export async function clearOnSuccess(email: string, ip: string) {
  await db
    .delete(accountLocks)
    .where(and(eq(accountLocks.email, email), eq(accountLocks.ip, ip)));
}
