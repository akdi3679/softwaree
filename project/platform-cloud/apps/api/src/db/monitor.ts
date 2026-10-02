import postgres from 'postgres';

export interface PoolStats {
  total: number;
  idle: number;
  waiting: number;
  max: number;
}

let lastStats: PoolStats = { total: 0, idle: 0, waiting: 0, max: 0 };

/**
 * Postgres-js exposes per-client pool state on the returned `sql` function.
 * We read the numeric slots without relying on private fields.
 */
function readPoolStats(client: ReturnType<typeof postgres>): PoolStats | null {
  const c = client as unknown as {
    totalCount?: number;
    idleCount?: number;
    waitingCount?: number;
    options?: { max?: number };
  };
  if (typeof c.totalCount !== 'number') return null;
  return {
    total: c.totalCount,
    idle: c.idleCount ?? 0,
    waiting: c.waitingCount ?? 0,
    max: c.options?.max ?? 0,
  };
}

/**
 * Start polling a pool's stats every `intervalMs` milliseconds.
 * Logs a warning when the pool has waiting clients (a sign of saturation).
 * Returns the interval handle so the caller can stop it if needed.
 */
export function startMonitor(
  client: ReturnType<typeof postgres>,
  intervalMs = 30_000,
): ReturnType<typeof setInterval> {
  return setInterval(() => {
    try {
      const stats = readPoolStats(client);
      if (stats === null) return;
      lastStats = stats;
      if (stats.waiting > 0) {
        console.warn('[db] pool has waiting clients', stats);
      }
    } catch (e) {
      console.error('[db] pool monitor failed', e);
    }
  }, intervalMs);
}

export function getLastStats(): PoolStats {
  return lastStats;
}