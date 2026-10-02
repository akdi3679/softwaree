import { createHash } from "node:crypto";
import { createClient, type ClickHouseClient } from "@clickhouse/client";
import { gte } from "drizzle-orm";
import { db } from "../db/client";
import { auditEntries } from "../db/schema/audit";

const CLICKHOUSE_URL = process.env.CLICKHOUSE_URL ?? "";
export const WAREHOUSE_ENABLED = CLICKHOUSE_URL.length > 0;

let clickhouse: ClickHouseClient | null = null;
if (WAREHOUSE_ENABLED) {
  clickhouse = createClient({
    url: CLICKHOUSE_URL,
    username: process.env.CLICKHOUSE_USER ?? "default",
    password: process.env.CLICKHOUSE_PASS ?? "",
  });
}

const ANON_SALT = process.env.ANON_SALT ?? "change-me-in-prod";

function anonymizeActor(actor: string | null): string {
  if (!actor) return "null";
  return createHash("sha256").update(actor + ANON_SALT).digest("hex").slice(0, 16);
}

export interface EtlResult {
  rows: number;
  duration_ms: number;
}

export async function runEtl(): Promise<EtlResult> {
  const start = Date.now();
  if (!clickhouse) {
    return { rows: 0, duration_ms: Date.now() - start };
  }
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
  const rows = await db
    .select()
    .from(auditEntries)
    .where(gte(auditEntries.occurredAt, yesterday));

  if (rows.length === 0) {
    return { rows: 0, duration_ms: Date.now() - start };
  }

  const values = rows.map((r) => ({
    account_id_anon: anonymizeActor(r.actorUserId),
    device_id_anon: anonymizeActor(r.actorDeviceId),
    category: r.category,
    action: r.action,
    result: r.result,
    occurred_at: r.occurredAt.toISOString(),
  }));

  await clickhouse.insert({
    table: "audit_events",
    values,
    format: "JSONEachRow",
  });

  return { rows: rows.length, duration_ms: Date.now() - start };
}

export function schedule(): void {
  setInterval(
    () => {
      runEtl()
        .then((result) => console.log("[warehouse] etl complete", result))
        .catch((e) => console.error("[warehouse] etl failed", e));
    },
    24 * 3600 * 1000,
  );
}