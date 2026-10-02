import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const devices = pgTable(
  'devices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    deviceId: uuid('device_id').notNull().unique().defaultRandom(),
    ownerUserId: uuid('owner_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id'),
    role: varchar('role', { length: 32 }).notNull().default('user'),
    publicKey: varchar('public_key', { length: 512 }).notNull(),
    state: varchar('state', { length: 32 }).notNull().default('pending'),
    displayName: varchar('display_name', { length: 256 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
    replacedByDeviceId: uuid('replaced_by_device_id'),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    revokedReason: varchar('revoked_reason', { length: 256 }),
  },
  (t) => ({
    deviceIdIdx: index('devices_device_id_idx').on(t.deviceId),
    ownerIdx: index('devices_owner_idx').on(t.ownerUserId),
    projectIdx: index('devices_project_idx').on(t.projectId),
  }),
);

export type DeviceRow = typeof devices.$inferSelect;
export type DeviceInsert = typeof devices.$inferInsert;
