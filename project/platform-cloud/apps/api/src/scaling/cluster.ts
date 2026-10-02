import os from "node:os";
import { sql } from "drizzle-orm";
import { db } from "../db/client";

export interface ClusterNode {
  instance_id: string;
  started_at: string;
  last_heartbeat: string;
  cpu_load_1m: number;
  version: string;
}

export function getInstanceId(): string {
  return process.env.HOSTNAME ?? `${os.hostname()}-${process.pid}`;
}

export async function heartbeat(): Promise<void> {
  const instanceId = getInstanceId();
  const load = os.loadavg()[0] ?? 0;
  const version = process.env.npm_package_version ?? "0.1.0";
  await db.execute(sql`
    INSERT INTO cluster_nodes (instance_id, last_heartbeat, cpu_load_1m, version)
    VALUES (${instanceId}, NOW(), ${load}, ${version})
    ON CONFLICT (instance_id) DO UPDATE
    SET last_heartbeat = NOW(),
        cpu_load_1m = ${load},
        version = ${version}
  `);
}

export async function listActiveNodes(maxAgeSeconds = 60): Promise<ClusterNode[]> {
  const rows = await db.execute(sql`
    SELECT instance_id, started_at, last_heartbeat, cpu_load_1m, version
    FROM cluster_nodes
    WHERE last_heartbeat > NOW() - make_interval(secs => ${maxAgeSeconds})
    ORDER BY instance_id
  `);
  return (rows as unknown as Array<Record<string, unknown>>).map((r) => ({
    instance_id: String(r.instance_id),
    started_at: String(r.started_at),
    last_heartbeat: String(r.last_heartbeat),
    cpu_load_1m: Number(r.cpu_load_1m ?? 0),
    version: String(r.version ?? "0.0.0"),
  }));
}

/// Simple hash-mod routing for v1. v2 uses consistent hashing.
export function instanceForProject(projectId: string, totalReplicas: number): number {
  let hash = 0;
  for (const ch of projectId) {
    hash = ((hash * 31) + ch.charCodeAt(0)) | 0;
  }
  return Math.abs(hash) % Math.max(1, totalReplicas);
}