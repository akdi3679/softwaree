import { pgTable, uuid, varchar, timestamp, index, jsonb, inet } from 'drizzle-orm/pg-core';

export const auditEntries = pgTable(
  'audit_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    category: varchar('category', { length: 32 }).notNull(),
    action: varchar('action', { length: 64 }).notNull(),
    actorUserId: uuid('actor_user_id'),
    actorDeviceId: uuid('actor_device_id'),
    actorIp: inet('actor_ip'),
    targetType: varchar('target_type', { length: 32 }),
    targetId: varchar('target_id', { length: 128 }),
    projectId: uuid('project_id'),
    result: varchar('result', { length: 32 }).notNull(),
    prevHash: varchar('prev_hash', { length: 64 }).notNull(),
    entryHash: varchar('entry_hash', { length: 64 }).notNull(),
    details: jsonb('details').$type<Record<string, unknown>>().default({}),
  },
  (t) => ({
    categoryIdx: index('audit_category_idx').on(t.category),
    actorIdx: index('audit_actor_idx').on(t.actorUserId),
    targetIdx: index('audit_target_idx').on(t.targetType, t.targetId),
    projectIdx: index('audit_project_idx').on(t.projectId),
    occurredIdx: index('audit_occurred_idx').on(t.occurredAt),
  }),
);

export type AuditEntryRow = typeof auditEntries.$inferSelect;
export type AuditEntryInsert = typeof auditEntries.$inferInsert;
