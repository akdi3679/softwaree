# TASK ID: CLOUD-003.4
# TITLE: Define accounts schema
# STATUS: pending
# DEPENDENCIES: CLOUD-003.3
# ALLOWED FILES: platform-cloud/apps/api/src/db/schema/accounts.ts, platform-cloud/apps/api/src/db/schema/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Define the `accounts` table schema in Drizzle.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/apps/api/src/db/schema/accounts.ts`:

```typescript
import { pgTable, text, timestamp, uuid, varchar, index } from 'drizzle-orm/pg-core';

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    primaryUserId: uuid('primary_user_id').notNull().unique(),
    email: varchar('email', { length: 256 }).notNull().unique(),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    displayName: varchar('display_name', { length: 256 }).notNull(),
    status: varchar('status', { length: 32 }).notNull().default('active'),
    // Password hash (Argon2id). Never the password itself.
    passwordHash: text('password_hash'),
    // For WebAuthn
    webauthnCredentials: text('webauthn_credentials'), // JSON array
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  },
  (t) => ({
    emailIdx: index('accounts_email_idx').on(t.email),
    statusIdx: index('accounts_status_idx').on(t.status),
  }),
);

export type AccountRow = typeof accounts.$inferSelect;
export type AccountInsert = typeof accounts.$inferInsert;
```

Create `platform-cloud/apps/api/src/db/schema/index.ts` (re-export all schemas):

```typescript
export * from './accounts';
```

## TESTS

```bash
cd platform-cloud
test -f apps/api/src/db/schema/accounts.ts || { echo "FAIL"; exit 1; }
test -f apps/api/src/db/schema/index.ts || { echo "FAIL: no index"; exit 1; }
grep -q "pgTable" apps/api/src/db/schema/accounts.ts || { echo "FAIL: not pgTable"; exit 1; }
grep -q "passwordHash" apps/api/src/db/schema/accounts.ts || { echo "FAIL: no password hash"; exit 1; }
pnpm --filter @cloud/api typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
