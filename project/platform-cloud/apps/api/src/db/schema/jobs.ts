import { pgTable, uuid, varchar, text, integer, timestamp, index } from 'drizzle-orm/pg-core';

export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: varchar('type', { length: 64 }).notNull(),
    payload: text('payload').notNull(),
    state: varchar('state', { length: 32 }).notNull().default('queued'),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(3),
    runAfter: timestamp('run_after', { withTimezone: true }).notNull(),
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => ({
    stateRunAfterIdx: index('jobs_state_run_after_idx').on(t.state, t.runAfter),
  }),
);

export type JobRow = typeof jobs.$inferSelect;
export type JobInsert = typeof jobs.$inferInsert;
