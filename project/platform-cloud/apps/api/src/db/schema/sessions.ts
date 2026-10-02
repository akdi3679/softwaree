import { pgTable, uuid, varchar, timestamp, index, jsonb, inet } from 'drizzle-orm/pg-core';
import { users } from './users';

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: varchar('session_id', { length: 64 }).notNull().unique(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    deviceId: uuid('device_id').notNull(),
    projectId: uuid('project_id'),
    refreshTokenHash: varchar('refresh_token_hash', { length: 128 }).notNull(),
    isRevoked: varchar('is_revoked', { length: 16 }).notNull().default('false'),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    revokedReason: varchar('revoked_reason', { length: 256 }),
    issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow(),
    lastUsedIp: inet('last_used_ip'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  },
  (t) => ({
    sessionIdIdx: index('sessions_session_id_idx').on(t.sessionId),
    userIdx: index('sessions_user_idx').on(t.userId),
    deviceIdx: index('sessions_device_idx').on(t.deviceId),
    expiresIdx: index('sessions_expires_idx').on(t.expiresAt),
  }),
);

export type SessionRow = typeof sessions.$inferSelect;
export type SessionInsert = typeof sessions.$inferInsert;
