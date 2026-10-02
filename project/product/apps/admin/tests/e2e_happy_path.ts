import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

const CLOUD = process.env.CLOUD_URL ?? 'http://localhost:8787';
const ADMIN_API = 'http://localhost:9000';

test('signup ? project ? invite ? write', async ({ page }) => {
  const r1 = await fetch(`${CLOUD}/v1/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `e2e-${Date.now()}@example.com`, password: 'SecurePass!2024' }),
  });
  expect(r1.status).toBe(201);
  const { session_token } = await r1.json();

  const r2 = await fetch(`${CLOUD}/v1/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session_token}` },
    body: JSON.stringify({ name: 'E2E Clinic', plan: 'team' }),
  });
  expect(r2.status).toBe(201);
  const { project } = await r2.json();

  const r3 = await fetch(`${CLOUD}/v1/projects/${project.id}/invitations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session_token}` },
    body: JSON.stringify({ email: 'doctor@example.com', role: 'doctor' }),
  });
  expect(r3.status).toBe(201);

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

  const out = execSync(`sqlite3 ${process.env.ADMIN_PROJECTS}/${project.id}.sqlite "SELECT COUNT(*) FROM events;"`).toString();
  expect(parseInt(out.trim(), 10)).toBe(1);
});
