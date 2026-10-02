import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { backups, projects } from '../db/schema';

const PLAN_LIMITS_BYTES: Record<string, number> = {
  local: 0,
  starter: 5 * 1024 * 1024 * 1024,
  team: 50 * 1024 * 1024 * 1024,
  enterprise: 5 * 1024 * 1024 * 1024 * 1024,
};

export async function currentUsage(accountId: string): Promise<number> {
  const rows = await db
    .select({ bytes: backups.sizeBytes })
    .from(backups)
    .innerJoin(projects, eq(backups.projectId, projects.id))
    .where(eq(projects.ownerUserId, accountId));
  return rows.reduce((sum, r) => sum + r.bytes, 0);
}

export async function canUpload(accountId: string, plan: string, size: number) {
  const limit = PLAN_LIMITS_BYTES[plan] ?? 0;
  if (limit === 0) return { ok: false, reason: 'plan does not allow backups' };
  const cur = await currentUsage(accountId);
  if (cur + size > limit) {
    return { ok: false, reason: `would exceed plan storage limit` };
  }
  return { ok: true };
}
