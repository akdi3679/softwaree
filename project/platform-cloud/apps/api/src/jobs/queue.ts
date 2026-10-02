import { eq, and, lte } from 'drizzle-orm';
import { db } from '../db/client';
import { jobs } from '../db/schema';

export type JobType =
  | 'send_email'
  | 'export_data'
  | 'module_publish_review'
  | 'backup_verification';

export type JobState = 'queued' | 'running' | 'completed' | 'failed' | 'dead';

export interface Job {
  id: string;
  type: JobType;
  payload: string;
  state: JobState;
  attempts: number;
  maxAttempts: number;
  runAfter: Date;
  lastError: string | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}

export async function enqueue(
  type: JobType,
  payload: any,
  opts?: { runAfter?: Date; maxAttempts?: number },
) {
  const rows = await db
    .insert(jobs)
    .values({
      type,
      payload: JSON.stringify(payload),
      state: 'queued',
      attempts: 0,
      maxAttempts: opts?.maxAttempts ?? 3,
      runAfter: opts?.runAfter ?? new Date(),
      createdAt: new Date(),
    })
    .returning();
  const row = rows[0];
  if (!row) throw new Error('job insert failed');
  return row.id;
}

export async function dequeue(types: JobType[]): Promise<Job | null> {
  const now = new Date();
  const rows = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.state, 'queued'), lte(jobs.runAfter, now)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const updatedAttempts = row.attempts + 1;
  await db
    .update(jobs)
    .set({ state: 'running', startedAt: now, attempts: updatedAttempts })
    .where(eq(jobs.id, row.id));

  return {
    id: row.id,
    type: row.type as JobType,
    payload: row.payload,
    state: 'running',
    attempts: updatedAttempts,
    maxAttempts: row.maxAttempts,
    runAfter: row.runAfter,
    lastError: row.lastError,
    createdAt: row.createdAt,
    startedAt: now,
    completedAt: row.completedAt,
  };
}

export async function complete(id: string) {
  await db.update(jobs).set({ state: 'completed', completedAt: new Date() }).where(eq(jobs.id, id));
}

export async function fail(id: string, error: string, willRetry: boolean) {
  if (willRetry) {
    await db.update(jobs).set({ state: 'queued', lastError: error }).where(eq(jobs.id, id));
  } else {
    await db
      .update(jobs)
      .set({ state: 'dead', lastError: error, completedAt: new Date() })
      .where(eq(jobs.id, id));
  }
}
