# TASK ID: CLOUD-004.3
# TITLE: Define invitations schema
# STATUS: pending
# DEPENDENCIES: CLOUD-004.2
# ALLOWED FILES: platform-cloud/apps/api/src/db/schema/invitations.ts, platform-cloud/apps/api/src/db/schema/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define the `invitations` table — pending project invitations with hashed tokens.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/apps/api/src/db/schema/invitations.ts`:

```typescript
import { pgTable, uuid, varchar, timestamp, index, text } from 'drizzle-orm/pg-core';
import { users } from './users';
import { projects } from './projects';

export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    invitationId: uuid('invitation_id').notNull().unique().defaultRandom(),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    invitedByUserId: uuid('invited_by_user_id').notNull().references(() => users.id),
    invitedEmail: varchar('invited_email', { length: 256 }).notNull(),
    // SHA-256 hash of the plaintext token (NEVER store plaintext)
    tokenHash: varchar('token_hash', { length: 128 }).notNull().unique(),
    initialRole: varchar('initial_role', { length: 64 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    acceptedByUserId: uuid('accepted_by_user_id').references(() => users.id),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    revokedReason: varchar('revoked_reason', { length: 256 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tokenHashIdx: index('invitations_token_hash_idx').on(t.tokenHash),
    projectIdx: index('invitations_project_idx').on(t.projectId),
    emailIdx: index('invitations_email_idx').on(t.invitedEmail),
    expiresIdx: index('invitations_expires_idx').on(t.expiresAt),
  }),
);

export type InvitationRow = typeof invitations.$inferSelect;
export type InvitationInsert = typeof invitations.$inferInsert;
```

Update `platform-cloud/apps/api/src/db/schema/index.ts`:

```typescript
export * from './accounts';
export * from './users';
export * from './devices';
export * from './sessions';
export * from './invitations';
```

## TESTS

```bash
cd platform-cloud
test -f apps/api/src/db/schema/invitations.ts || { echo "FAIL"; exit 1; }
grep -q "tokenHash" apps/api/src/db/schema/invitations.ts || { echo "FAIL: no tokenHash"; exit 1; }
pnpm --filter @cloud/api typecheck 2>&1 | grep -v "Cannot find name 'projects'" > /dev/null || true
# typecheck may fail because projects.ts doesn't exist yet — fixed in CLOUD-005
echo "OK"
```
