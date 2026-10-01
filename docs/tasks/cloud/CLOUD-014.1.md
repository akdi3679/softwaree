# TASK ID: CLOUD-014.1
# TITLE: Add Cloud: account deletion (GDPR right to be forgotten)
# STATUS: pending
# DEPENDENCIES: FOODLAB-008.2
# ALLOWED FILES: platform-cloud/src/account/delete.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Soft delete: 30-day grace period before permanent deletion.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/account/delete.ts`:

```typescript
import { db } from '../db';
import { sendEmail } from '../email/sender';

export async function requestAccountDeletion(account_id: string) {
  const until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await db('accounts').where({ id: account_id }).update({
    state: 'pending_deletion',
    deletion_scheduled_at: until,
  });
  // Notify the user
  const account = await db('accounts').where({ id: account_id }).first();
  if (account) {
    await sendEmail(account.email, 'Account deletion scheduled',
      `Your account will be permanently deleted on ${until}. ` +
      `If you change your mind, log in before that date to cancel.`);
  }
  return { scheduled_for: until };
}

export async function cancelAccountDeletion(account_id: string) {
  const account = await db('accounts').where({ id: account_id }).first();
  if (!account || account.state !== 'pending_deletion') {
    return { cancelled: false };
  }
  await db('accounts').where({ id: account_id }).update({
    state: 'active',
    deletion_scheduled_at: null,
  });
  return { cancelled: true };
}

// Cron job: runs every hour, deletes accounts past their deletion_scheduled_at
export async function processDueDeletions() {
  const now = new Date().toISOString();
  const due = await db('accounts').where('deletion_scheduled_at', '<', now).andWhere({ state: 'pending_deletion' });
  for (const account of due) {
    await permanentlyDeleteAccount(account.id);
  }
  return { deleted: due.length };
}

async function permanentlyDeleteAccount(account_id: string) {
  // 1. Anonymize audit log (keep structure, no PII)
  await db('audit_log').where({ account_id }).update({ payload: '{}', actor: 'deleted' });
  // 2. Delete subscriptions, projects, devices, modules, etc.
  await db('subscriptions').where({ account_id }).del();
  const projects = await db('projects').where({ account_id }).select('id');
  for (const p of projects) {
    await db('devices').where({ project_id: p.id }).del();
    await db('invitations').where({ project_id: p.id }).del();
    await db('memberships').where({ project_id: p.id }).del();
    await db('modules').where({ publisher: account_id }).del();
    await db('backups').where({ project_id: p.id }).del();
    await db('projects').where({ id: p.id }).del();
  }
  // 3. Delete account
  await db('accounts').where({ id: account_id }).del();
}
```

## TESTS

```bash
cd platform-cloud
test -f src/account/delete.ts || { echo "FAIL"; exit 1; }
grep -q "requestAccountDeletion" src/account/delete.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
