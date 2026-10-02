import { sql } from "drizzle-orm";
import { db } from "../db/client";

/// HIPAA requires 6 years; SOC 2 typically 1 year; we keep the max.
export const AUDIT_RETENTION_DAYS = 6 * 365;

/// Delete audit entries older than the retention window.
/// Runs daily from a scheduled job. Returns number of rows deleted.
export async function pruneAuditLog(): Promise<number> {
  const result = await db.execute(sql`
    WITH deleted AS (
      DELETE FROM audit_entries
      WHERE occurred_at < NOW() - make_interval(days => ${AUDIT_RETENTION_DAYS})
      RETURNING id
    )
    SELECT COUNT(*) AS n FROM deleted
  `);
  const rows = result as unknown as Array<{ n: number | string }>;
  const n = rows[0]?.n;
  return typeof n === "string" ? Number.parseInt(n, 10) : (n ?? 0);
}

/// Report the oldest and newest entry timestamps.
export async function auditWindow(): Promise<{ oldest: string | null; newest: string | null }> {
  const result = await db.execute(sql`
    SELECT MIN(occurred_at) AS oldest, MAX(occurred_at) AS newest FROM audit_entries
  `);
  const rows = result as unknown as Array<{ oldest: string | null; newest: string | null }>;
  return { oldest: rows[0]?.oldest ?? null, newest: rows[0]?.newest ?? null };
}