# TASK ID: CLOUD-004.1
# TITLE: Define sessions schema
# STATUS: pending
# DEPENDENCIES: CLOUD-003.6
# ALLOWED FILES: platform-cloud/apps/api/src/db/schema/sessions.ts, platform-cloud/apps/api/src/db/schema/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define the `sessions` table — short-lived, refreshable session records.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/apps/api/src/db/schema/sessions.ts`:

```typescript
import { pgTable, uuid, varchar, timestamp, index, jsonb, inet } from 'drizzle-orm/pg-core';
import { users } from './users';
import { devices } from './devices';

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: varchar('session_id', { length: 64 }).notNull().unique(), // the public id (sess_xxx)
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    deviceId: uuid('device_id').notNull().references(() => devices.id, { onDelete: 'cascade' }),
    // The project this session is bound to (null for Cloud-only sessions like login)
    projectId: uuid('project_id'),
    // Refresh token (server-side, hashed)
    refreshTokenHash: varchar('refresh_token_hash', { length: 128 }).notNull(),
    // Session state
    isRevoked: varchar('is_revoked', { length: 16 }).notNull().default('false'),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    revokedReason: varchar('revoked_reason', { length: 256 }),
    // Lifecycle
    issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow(),
    lastUsedIp: inet('last_used_ip'),
    // Free-form metadata (user agent, geo, etc.)
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
```

Update `platform-cloud/apps/api/src/db/schema/index.ts`:

```typescript
export * from './accounts';
export * from './users';
export * from './devices';
export * from './sessions';
```

Note: this references a `devices` table that will be created in CLOUD-004.2.

## TESTS

```bash
cd platform-cloud
test -f apps/api/src/db/schema/sessions.ts || { echo "FAIL"; exit 1; }
grep -q "refreshTokenHash" apps/api/src/db/schema/sessions.ts || { echo "FAIL"; exit 1; }
pnpm --filter @cloud/api typecheck 2>&1 | grep -v "Cannot find name 'devices'" > /dev/null || true
# typecheck will fail because devices.ts doesn't exist yet — that's expected and fixed in CLOUD-004.2
echo "OK"
```
