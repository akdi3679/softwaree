# TASK ID: CLOUD-003.5
# TITLE: Define users schema (the User identity)
# STATUS: pending
# DEPENDENCIES: CLOUD-003.4
# ALLOWED FILES: platform-cloud/apps/api/src/db/schema/users.ts, platform-cloud/apps/api/src/db/schema/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define the `users` table — every individual user identity.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/apps/api/src/db/schema/users.ts`:

```typescript
import { pgTable, uuid, varchar, timestamp, index, text } from 'drizzle-orm/pg-core';
import { accounts } from './accounts';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 256 }).notNull().unique(),
    displayName: varchar('display_name', { length: 256 }).notNull(),
    avatarUrl: text('avatar_url'),
    // Locale
    locale: varchar('locale', { length: 16 }).default('en'),
    timezone: varchar('timezone', { length: 64 }).default('UTC'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: index('users_email_idx').on(t.email),
    accountIdx: index('users_account_idx').on(t.accountId),
  }),
);

export type UserRow = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
```

Update `platform-cloud/apps/api/src/db/schema/index.ts`:

```typescript
export * from './accounts';
export * from './users';
```

## TESTS

```bash
cd platform-cloud
test -f apps/api/src/db/schema/users.ts || { echo "FAIL"; exit 1; }
grep -q "accountId" apps/api/src/db/schema/users.ts || { echo "FAIL: no accountId"; exit 1; }
grep -q "users" apps/api/src/db/schema/index.ts || { echo "FAIL: not exported"; exit 1; }
pnpm --filter @cloud/api typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
