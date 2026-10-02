import { pgTable, uuid, varchar, bigint, timestamp, index, jsonb } from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const backups = pgTable(
  'backups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    backupId: uuid('backup_id').notNull().unique().defaultRandom(),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    kind: varchar('kind', { length: 32 }).notNull(),
    state: varchar('state', { length: 32 }).notNull().default('pending'),
    sourceDeviceId: uuid('source_device_id').notNull(),
    sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
    contentSha256: varchar('content_sha256', { length: 64 }).notNull(),
    storagePath: varchar('storage_path', { length: 512 }).notNull(),
    snapshotTakenAt: timestamp('snapshot_taken_at', { withTimezone: true }).notNull(),
    snapshotAtSequence: bigint('snapshot_at_sequence', { mode: 'number' }).notNull(),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    restoredAt: timestamp('restored_at', { withTimezone: true }),
    restoredByDeviceId: uuid('restored_by_device_id'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  },
  (t) => ({
    projectIdx: index('backups_project_idx').on(t.projectId),
    stateIdx: index('backups_state_idx').on(t.state),
    expiresIdx: index('backups_expires_idx').on(t.expiresAt),
  }),
);

export type BackupRow = typeof backups.$inferSelect;
export type BackupInsert = typeof backups.$inferInsert;
