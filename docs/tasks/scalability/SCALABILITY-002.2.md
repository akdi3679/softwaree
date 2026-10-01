# TASK ID: SCALABILITY-002.2
# TITLE: Add connection pool monitoring
# STATUS: pending
# DEPENDENCIES: SCALABILITY-002.1
# ALLOWED FILES: platform-cloud/src/db/monitor.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Expose connection pool stats as Prometheus metrics.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/db/monitor.ts`:

```typescript
import { db } from './index';

export interface PoolStats {
  total: number;
  idle: number;
  waiting: number;
  max: number;
}

let lastStats: PoolStats = { total: 0, idle: 0, waiting: 0, max: 0 };

/// Periodically log pool stats. In a real impl, push to Prometheus.
export function startMonitor() {
  setInterval(async () => {
    try {
      const pool = (db as any).$client ?? (db as any).pool;
      if (!pool) return;
      const stats: PoolStats = {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
        max: pool.options.max,
      };
      lastStats = stats;
      if (stats.waiting > 0) {
        console.warn('db pool has waiting clients', stats);
      }
    } catch (e) {
      console.error('pool monitor failed', e);
    }
  }, 30_000);
}

export function getLastStats(): PoolStats { return lastStats; }
```

## TESTS

```bash
cd platform-cloud
test -f src/db/monitor.ts || { echo "FAIL"; exit 1; }
grep -q "startMonitor" src/db/monitor.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
