import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "../db/client";
import { auditEntries } from "../db/schema/audit";

export const GENESIS_HASH =
  "0000000000000000000000000000000000000000000000000000000000000000";

export interface AuditInput {
  category: string;
  action: string;
  actorUserId: string | null;
  actorDeviceId: string | null;
  actorIp: string | null;
  targetType: string | null;
  targetId: string | null;
  projectId: string | null;
  result: "success" | "failure";
  details?: Record<string, unknown>;
}

function hashEntry(prevHash: string, occurredAt: string, input: AuditInput): string {
  const details = JSON.stringify(input.details ?? {});
  const payload =
    prevHash +
    "|" + occurredAt +
    "|" + input.category +
    "|" + input.action +
    "|" + (input.actorUserId ?? "") +
    "|" + (input.actorDeviceId ?? "") +
    "|" + (input.actorIp ?? "") +
    "|" + (input.targetType ?? "") +
    "|" + (input.targetId ?? "") +
    "|" + (input.projectId ?? "") +
    "|" + input.result +
    "|" + details;
  return createHash("sha256").update(payload).digest("hex");
}

export async function appendAudit(input: AuditInput) {
  const prevRows = await db
    .select({ hash: auditEntries.entryHash })
    .from(auditEntries)
    .orderBy(sql`${auditEntries.occurredAt} DESC`)
    .limit(1);
  const prevHash = prevRows[0]?.hash ?? GENESIS_HASH;
  const occurredAt = new Date().toISOString();
  const entryHash = hashEntry(prevHash, occurredAt, input);

  const inserted = await db
    .insert(auditEntries)
    .values({
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
    .returning({ id: auditEntries.id });

  const insertedRow = inserted[0];
  if (!insertedRow) {
    throw new Error("audit insert returned no row");
  }
  return { id: insertedRow.id, entryHash };
}

export async function verifyChain() {
  const rows = await db
    .select()
    .from(auditEntries)
    .orderBy(auditEntries.occurredAt);

  let prev = GENESIS_HASH;
  let valid = 0;
  for (const r of rows) {
    if (r.prevHash !== prev) {
      return { validCount: valid, totalCount: rows.length, brokenAt: r.id };
    }
    valid++;
    prev = r.entryHash;
  }
  return { validCount: valid, totalCount: rows.length, brokenAt: null };
}
