# TASK ID: LAUNCH-019.1
# TITLE: Add real device swap end-to-end test
# STATUS: pending
# DEPENDENCIES: LAUNCH-018.2
# ALLOWED FILES: product/apps/admin/tests/e2e_device_swap.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Full device swap ceremony, tested automatically.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/tests/e2e_device_swap.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';

const CLOUD = process.env.CLOUD_URL ?? 'http://localhost:8787';
const ADMIN_A = 'http://localhost:9001'; // original Admin
const ADMIN_B = 'http://localhost:9002'; // replacement

test('device swap ceremony', async () => {
  // 1. Setup: original Admin creates a project + 1 user
  const r1 = await fetch(`${CLOUD}/v1/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `swap-${Date.now()}@x.com`, password: 'SecurePass!2024' }),
  });
  const { session_token } = await r1.json();
  const r2 = await fetch(`${CLOUD}/v1/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session_token}` },
    body: JSON.stringify({ name: 'Swap Test', plan: 'team' }),
  });
  const { project } = await r2.json();
  // 2. Original Admin writes some data
  for (let i = 0; i < 5; i++) {
    await fetch(`${ADMIN_A}/v1/projects/${project.id}/commands`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command_type: 'patient.create', actor_id: 'usr_a', device_id: 'dev_a', payload: { full_name: `Patient ${i}`, phone: '555-0000' } }),
    });
  }
  // 3. Original Admin copies its data dir to the replacement
  const data_a = process.env.ADMIN_A_DATA!;
  const data_b = process.env.ADMIN_B_DATA!;
  await fs.cp(data_a, data_b, { recursive: true });
  // 4. New Admin begins replacement
  const r3 = await fetch(`${ADMIN_B}/v1/admin/begin_replacement`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: project.id, reason: 'lost' }),
  });
  const { ticket } = await r3.json();
  expect(ticket).toBeDefined();
  // 5. New Admin submits to Cloud
  const r4 = await fetch(`${CLOUD}/v1/projects/${project.id}/complete_replacement`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session_token}` },
    body: JSON.stringify({ ticket }),
  });
  expect(r4.status).toBe(200);
  // 6. Old Admin can no longer write
  const r5 = await fetch(`${ADMIN_A}/v1/projects/${project.id}/commands`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command_type: 'patient.create', actor_id: 'usr_a', device_id: 'dev_a', payload: { full_name: 'Should Fail', phone: '555' } }),
  });
  expect(r5.status).toBe(403);
  // 7. New Admin CAN write
  const r6 = await fetch(`${ADMIN_B}/v1/projects/${project.id}/commands`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command_type: 'patient.create', actor_id: 'usr_b', device_id: 'dev_b', payload: { full_name: 'After Swap', phone: '555' } }),
  });
  expect(r6.status).toBe(201);
  // 8. The 5 original records are still there
  const db = join(data_b, 'projects', `${project.id}.sqlite`);
  const count = parseInt(execSync(`sqlite3 ${db} "SELECT COUNT(*) FROM events;"`).toString().trim(), 10);
  expect(count).toBe(6); // 5 from before + 1 new
});
```

## TESTS

```bash
cd product
test -f apps/admin/tests/e2e_device_swap.ts || { echo "FAIL"; exit 1; }
grep -q "device_swap" apps/admin/tests/e2e_device_swap.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
