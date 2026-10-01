# TASK ID: ADMIN-040.1
# TITLE: Add Admin: full e2e test: signup → create project → invite → write event
# STATUS: pending
# DEPENDENCIES: USER-020.2
# ALLOWED FILES: product/apps/admin/tests/e2e_happy_path.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Automated end-to-end test that runs against a real Cloud + Admin in CI.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/tests/e2e_happy_path.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

const CLOUD = process.env.CLOUD_URL ?? 'http://localhost:8787';
const ADMIN_API = 'http://localhost:9000';

test('signup → project → invite → write', async ({ page }) => {
  // 1. Signup on Cloud
  const r1 = await fetch(`${CLOUD}/v1/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `e2e-${Date.now()}@example.com`, password: 'SecurePass!2024' }),
  });
  expect(r1.status).toBe(201);
  const { session_token } = await r1.json();

  // 2. Create project
  const r2 = await fetch(`${CLOUD}/v1/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session_token}` },
    body: JSON.stringify({ name: 'E2E Clinic', plan: 'team' }),
  });
  expect(r2.status).toBe(201);
  const { project } = await r2.json();

  // 3. Invite a user
  const r3 = await fetch(`${CLOUD}/v1/projects/${project.id}/invitations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session_token}` },
    body: JSON.stringify({ email: 'doctor@example.com', role: 'doctor' }),
  });
  expect(r3.status).toBe(201);

  // 4. Send a command to Admin (assume Admin app is running)
  const r4 = await fetch(`${ADMIN_API}/v1/projects/${project.id}/commands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      command_type: 'patient.create',
      actor_id: 'usr_admin',
      device_id: 'dev_1',
      payload: { full_name: 'John Doe', phone: '555-1234' },
    }),
  });
  expect(r4.status).toBe(201);

  // 5. Verify the event is in the local DB
  const out = execSync(`sqlite3 ${process.env.ADMIN_PROJECTS}/${project.id}.sqlite "SELECT COUNT(*) FROM events;"`).toString();
  expect(parseInt(out.trim(), 10)).toBe(1);
});
```

## TESTS

```bash
cd product
test -f apps/admin/tests/e2e_happy_path.ts || { echo "FAIL"; exit 1; }
grep -q "happy_path" apps/admin/tests/e2e_happy_path.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
