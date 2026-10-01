# TASK ID: CLOUD-006.4
# TITLE: Define backup metadata schema
# STATUS: pending
# DEPENDENCIES: CLOUD-006.3
# ALLOWED FILES: platform-cloud/apps/api/src/db/schema/backups.ts, platform-cloud/apps/api/src/db/schema/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define the `backups` table — Cloud's metadata about encrypted backups (NOT the backup content; that lives in MinIO).

## REQUIRED IMPLEMENTATION

Create `platform-cloud/apps/api/src/db/schema/backups.ts`:

```typescript
import { pgTable, uuid, varchar, bigint, timestamp, index, text, jsonb, inet } from 'drizzle-orm/pg-core';
import { projects } from './projects';

export const backups = pgTable(
  'backups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    backupId: uuid('backup_id').notNull().unique().defaultRandom(),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    // What this backup is
    kind: varchar('kind', { length: 32 }).notNull(), // 'auto' / 'manual'
    state: varchar('state', { length: 32 }).notNull().default('pending'),
    // Source device
    sourceDeviceId: uuid('source_device_id').notNull(),
    // Size and content addressing
    sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
    // SHA-256 of the encrypted blob (we can verify integrity without being able to decrypt)
    contentSha256: varchar('content_sha256', { length: 64 }).notNull(),
    // MinIO path of the encrypted blob
    storagePath: varchar('storage_path', { length: 512 }).notNull(),
    // When the snapshot was taken (Admin's clock at the time of snapshot)
    snapshotTakenAt: timestamp('snapshot_taken_at', { withTimezone: true }).notNull(),
    // Project sequence at snapshot time
    snapshotAtSequence: bigint('snapshot_at_sequence', { mode: 'number' }).notNull(),
    // Lifecycle
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    // For restores
    restoredAt: timestamp('restored_at', { withTimezone: true }),
    restoredByDeviceId: uuid('restored_by_device_id'),
    // Free-form metadata
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
```

Update `platform-cloud/apps/api/src/db/schema/index.ts`:

```typescript
export * from './accounts';
export * from './users';
export * from './devices';
export * from './sessions';
export * from './invitations';
export * from './projects';
export * from './memberships';
export * from './roles';
export * from './plans';
export * from './modules';
export * from './audit';
export * from './backups';
```

## TESTS

```bash
cd platform-cloud
test -f apps/api/src/db/schema/backups.ts || { echo "FAIL"; exit 1; }
grep -q "contentSha256" apps/api/src/db/schema/backups.ts || { echo "FAIL: no content hash"; exit 1; }
pnpm --filter @cloud/api typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
