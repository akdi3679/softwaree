import { logger } from '../lib/logger';

const JOBS: { name: string; intervalS: number; run: () => Promise<void> }[] = [
  { name: 'expire-sessions', intervalS: 300, run: async () => {} },
  { name: 'cleanup-pending-deletions', intervalS: 3600, run: async () => {} },
  { name: 'collect-metrics', intervalS: 60, run: async () => {} },
  { name: 'purge-old-audit', intervalS: 86400, run: async () => {} },
];

export function startScheduler() {
  for (const job of JOBS) {
    setInterval(async () => {
      try { await job.run(); } catch (e: any) { logger.error({ message: `job ${job.name} failed`, error: e.message }); }
    }, job.intervalS * 1000);
  }
}
