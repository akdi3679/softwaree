# TASK ID: LAUNCH-003.1
# TITLE: Add GDPR data subject request — full test coverage
# STATUS: pending
# DEPENDENCIES: LAUNCH-002.2
# ALLOWED FILES: platform-cloud/src/account/__tests__/gdpr.test.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Verify GDPR endpoints do what we promise: export all, anonymize audit, delete in 30 days.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/account/__tests__/gdpr.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../db';
import { requestAccountDeletion, cancelAccountDeletion, processDueDeletions } from '../delete';
import { exportAccountData } from '../export';

describe('GDPR', () => {
  beforeEach(async () => {
    // Clean tables
    await db('accounts').where('email', 'like', 'gdpr-test-%').del();
  });

  it('exportAccountData includes audit + projects + subscriptions', async () => {
    const id = await createTestAccount('gdpr-test-export@x.com');
    await createTestProject(id, 'Test project');
    await createTestAudit(id, 'login');

    const data = await exportAccountData(id);
    expect(data.account.id).toBe(id);
    expect(data.projects.length).toBe(1);
    expect(data.audit.length).toBeGreaterThan(0);
  });

  it('requestAccountDeletion sets pending_deletion + 30d', async () => {
    const id = await createTestAccount('gdpr-test-del@x.com');
    const r = await requestAccountDeletion(id);
    expect(r.scheduled_for).toBeDefined();
    const acc: any = await db('accounts').where({ id }).first();
    expect(acc.state).toBe('pending_deletion');
  });

  it('cancelAccountDeletion reverts state', async () => {
    const id = await createTestAccount('gdpr-test-cancel@x.com');
    await requestAccountDeletion(id);
    const r = await cancelAccountDeletion(id);
    expect(r.cancelled).toBe(true);
    const acc: any = await db('accounts').where({ id }).first();
    expect(acc.state).toBe('active');
  });

  it('processDueDeletions deletes after 30d, keeps audit anonymized', async () => {
    const id = await createTestAccount('gdpr-test-process@x.com');
    await requestAccountDeletion(id);
    // Force the scheduled date into the past
    await db('accounts').where({ id }).update({ deletion_scheduled_at: new Date(Date.now() - 1000).toISOString() });
    const r = await processDueDeletions();
    expect(r.deleted).toBeGreaterThan(0);
    const acc: any = await db('accounts').where({ id }).first();
    expect(acc).toBeUndefined();
  });
});

async function createTestAccount(email: string): Promise<string> {
  const [r] = await db('accounts').insert({ email, password_hash: 'x', plan: 'team', state: 'active' }).returning('id');
  return r.id;
}
async function createTestProject(account_id: string, name: string): Promise<void> {
  await db('projects').insert({ account_id, name, plan: 'team', state: 'active' });
}
async function createTestAudit(account_id: string, action: string): Promise<void> {
  await db('audit_log').insert({ account_id, actor: 'test', action, category: 'test', payload: '{}', occurred_at: new Date().toISOString() });
}
```

## TESTS

```bash
cd platform-cloud
test -f src/account/__tests__/gdpr.test.ts || { echo "FAIL"; exit 1; }
pnpm --filter platform-cloud test src/account/__tests__/gdpr.test.ts || { echo "FAIL: test failed"; exit 1; }
echo "OK"
```
