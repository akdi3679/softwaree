import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { auditEntries } from '../db/schema';
import { sha256Hex } from '../crypto/device-key';

const GENESIS_HASH = '0'.repeat(64);

export interface AppendAuditInput {
  category: 'auth' | 'device' | 'project' | 'billing' | 'security' | 'platform';
  action: string;
  actorUserId?: string;
  actorDeviceId?: string;
  actorIp?: string;
  targetType?: string;
  targetId?: string;
  projectId?: string;
  result: 'success' | 'failure' | 'denied';
  details?: Record<string, unknown>;
}

export async function appendAudit(input: AppendAuditInput) {
  const latest = await db
    .select({ entryHash: auditEntries.entryHash })
    .from(auditEntries)
    .orderBy(desc(auditEntries.occurredAt))
    .limit(1);
  const prevHash = latest[0]?.entryHash ?? GENESIS_HASH;

  const occurredAt = new Date();
  const body = JSON.stringify({
    occurredAt: occurredAt.toISOString(),
    category: input.category,
    action: input.action,
    actorUserId: input.actorUserId,
    actorDeviceId: input.actorDeviceId,
    actorIp: input.actorIp,
    targetType: input.targetType,
    targetId: input.targetId,
    projectId: input.projectId,
    result: input.result,
    details: input.details ?? {},
  });
  const entryHash = sha256Hex(new TextEncoder().encode(prevHash + body));

  const [row] = await db
    .insert(auditEntries)
    .values({
      occurredAt,
      category: input.category,
      action: input.action,
      actorUserId: input.actorUserId,
      actorDeviceId: input.actorDeviceId,
      actorIp: input.actorIp,
      targetType: input.targetType,
      targetId: input.targetId,
      projectId: input.projectId,
      result: input.result,
      prevHash,
      entryHash,
      details: input.details ?? {},
    })
    .returning();

  return row;
}

export async function listAuditForProject(projectId: string, limit = 100) {
  return db
    .select()
    .from(auditEntries)
    .where(eq(auditEntries.projectId, projectId))
    .orderBy(desc(auditEntries.occurredAt))
    .limit(limit);
}
