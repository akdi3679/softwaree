import os from "node:os";
import { sql } from "drizzle-orm";
import { db } from "../db/client";

const STARTED_AT = new Date();

export interface HealthStatus {
  status: "ok" | "degraded" | "down";
  uptime_seconds: number;
  memory_mb: number;
  cpu_load: number[];
  db_reachable: boolean;
  db_lag_ms: number;
  version: string;
  instance_id: string;
  started_at: string;
}

export async function healthCheck(): Promise<HealthStatus> {
  const mem = process.memoryUsage();
  const load = os.loadavg();

  let dbReachable = false;
  let dbLag = -1;
  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    dbLag = Date.now() - start;
    dbReachable = true;
  } catch {
    dbReachable = false;
  }

  return {
    status: dbReachable ? "ok" : "degraded",
    uptime_seconds: Math.floor((Date.now() - STARTED_AT.getTime()) / 1000),
    memory_mb: Math.round(mem.rss / 1024 / 1024),
    cpu_load: load,
    db_reachable: dbReachable,
    db_lag_ms: dbLag,
    version: process.env.npm_package_version ?? "0.1.0",
    instance_id: `-`,
    started_at: STARTED_AT.toISOString(),
  };
}

export async function readyCheck(): Promise<{ ready: boolean; reason?: string }> {
  try {
    await db.execute(sql`SELECT 1 FROM cluster_nodes LIMIT 1`);
    return { ready: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // If the table doesn't exist yet, we're still starting up.
    if (msg.includes("does not exist")) {
      return { ready: false, reason: "migrations not applied" };
    }
    return { ready: false, reason: msg };
  }
}