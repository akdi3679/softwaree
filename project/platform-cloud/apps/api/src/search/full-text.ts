import { db } from '../db/client';

export async function searchEvents(opts: {
  accountId: string;
  query: string;
  from?: string;
  until?: string;
  limit?: number;
}) {
  const limit = opts.limit ?? 50;
  // Placeholder: we'll query audit entries instead of events
  return [] as unknown[];
}
