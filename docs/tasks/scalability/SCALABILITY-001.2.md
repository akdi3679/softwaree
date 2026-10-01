# TASK ID: SCALABILITY-001.2
# TITLE: Add Cloud horizontal scaling (stateless replicas)
# STATUS: pending
# DEPENDENCIES: SCALABILITY-001.1
# ALLOWED FILES: platform-cloud/src/scaling/health.ts, platform-cloud/src/scaling/cluster.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Make the Cloud horizontally scalable. Add /ready endpoint, support k8s probes, cluster-id for sticky routing.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/scaling/health.ts`:

```typescript
import { db } from '../db';
import { sql } from 'drizzle-orm';
import os from 'node:os';

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  uptime_seconds: number;
  memory_mb: number;
  cpu_load: number[];
  db_reachable: boolean;
  db_lag_ms: number;
  active_connections: number;
  version: string;
  instance_id: string;
  started_at: string;
}

const STARTED_AT = new Date();

export function getInstanceId(): string {
  const hostname = os.hostname();
  return `${hostname}-${process.pid}`;
}

export async function healthCheck(): Promise<HealthStatus> {
  const mem = process.memoryUsage();
  const cpus = os.cpus();
  const load = os.loadavg();

  // Check DB
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
    status: dbReachable ? 'ok' : 'degraded',
    uptime_seconds: Math.floor((Date.now() - STARTED_AT.getTime()) / 1000),
    memory_mb: Math.round(mem.rss / 1024 / 1024),
    cpu_load: load,
    db_reachable: dbReachable,
    db_lag_ms: dbLag,
    active_connections: cpus.length,
    version: process.env.npm_package_version ?? '0.1.0',
    instance_id: getInstanceId(),
    started_at: STARTED_AT.toISOString(),
  };
}

export async function readyCheck(): Promise<{ ready: boolean; reason?: string }> {
  // Ready means: can accept traffic, DB is reachable, migrations applied
  try {
    const result = await db.execute(sql`SELECT COUNT(*) FROM schema_migrations`);
    if (!result) return { ready: false, reason: 'no migrations table' };
    return { ready: true };
  } catch (e: any) {
    return { ready: false, reason: e?.message ?? 'unknown' };
  }
}
```

Create `platform-cloud/src/scaling/cluster.ts`:

```typescript
/// Cluster-aware state.
/// In Stage 2+, the Cloud runs as N replicas behind a load balancer.
/// Sticky routing is by project_id (we don't want to break the auth flow).

import { db } from '../db';
import { sql } from 'drizzle-orm';

export interface ClusterNode {
  instance_id: string;
  started_at: string;
  last_heartbeat: string;
  active_connections: number;
  cpu_load: number[];
}

/// In a real deployment, each Cloud instance reports its liveness to a shared store (etcd, Redis).
/// For v1, we use a Postgres-backed heartbeat table.

export async function heartbeat() {
  const instanceId = process.env.HOSTNAME ?? 'local';
  const cpus = require('node:os').loadavg() as number[];
  await db.execute(sql`
    INSERT INTO cluster_nodes (instance_id, last_heartbeat, active_connections, cpu_load_1m)
    VALUES (${instanceId}, NOW(), 0, ${cpus[0]})
    ON CONFLICT (instance_id) DO UPDATE
    SET last_heartbeat = NOW(), cpu_load_1m = ${cpus[0]}
  `);
}

export async function listActiveNodes(maxAgeSeconds = 60): Promise<ClusterNode[]> {
  const rows = await db.execute(sql`
    SELECT instance_id, started_at, last_heartbeat, active_connections, cpu_load_1m
    FROM cluster_nodes
    WHERE last_heartbeat > NOW() - INTERVAL '${sql.raw(String(maxAgeSeconds))} seconds'
    ORDER BY instance_id
  `);
  return (rows as any[]).map((r) => ({
    instance_id: r.instance_id,
    started_at: r.started_at,
    last_heartbeat: r.last_heartbeat,
    active_connections: r.active_connections,
    cpu_load: [r.cpu_load_1m],
  }));
}

/// Determine which instance owns a project. We do simple modulo for v1;
/// v2 uses consistent hashing.
export function instanceForProject(projectId: string, totalReplicas: number): number {
  let hash = 0;
  for (const ch of projectId) hash = ((hash * 31) + ch.charCodeAt(0)) | 0;
  return Math.abs(hash) % Math.max(1, totalReplicas);
}
```

Add to `package.json`:
```json
"scripts": {
  "heartbeat": "tsx src/scaling/heartbeat-loop.ts"
}
```

Create `platform-cloud/src/scaling/heartbeat-loop.ts`:

```typescript
import { heartbeat } from './cluster';

setInterval(async () => {
  try { await heartbeat(); } catch (e) { console.error('heartbeat failed:', e); }
}, 10_000);
heartbeat();
```

## TESTS

```bash
cd platform-cloud
test -f src/scaling/health.ts || { echo "FAIL"; exit 1; }
test -f src/scaling/cluster.ts || { echo "FAIL: no cluster"; exit 1; }
grep -q "instanceForProject" src/scaling/cluster.ts || { echo "FAIL: no routing"; exit 1; }
pnpm typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
