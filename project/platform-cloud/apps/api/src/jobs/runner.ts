import { dequeue, complete, fail, type JobType } from './queue';
import { logger } from '../lib/logger';

const HANDLERS: Record<JobType, (payload: any) => Promise<void>> = {
  send_email: async () => {},
  export_data: async () => {},
  module_publish_review: async () => {},
  backup_verification: async () => {},
};

export function startRunner() {
  setInterval(async () => {
    try {
      while (true) {
        const job = await dequeue(Object.keys(HANDLERS) as JobType[]);
        if (!job) break;
        const handler = HANDLERS[job.type];
        try {
          await handler(JSON.parse(job.payload));
          await complete(job.id);
        } catch (e: any) {
          const willRetry = job.attempts < job.maxAttempts;
          await fail(job.id, e?.message ?? String(e), willRetry);
          if (!willRetry) {
            logger.error({ message: `job dead: ${job.id}`, type: job.type, error: e?.message });
          }
        }
      }
    } catch (e) {
      logger.error({ message: 'job loop failed', error: String(e) });
    }
  }, 1000);
}
