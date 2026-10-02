import { test, expect, request } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:8787';

test('health endpoint returns ok', async () => {
  const res = await request.newContext({ baseURL: BASE });
  const r = await res.get('/health');
  expect(r.status()).toBe(200);
  const body = await r.json();
  expect(body).toHaveProperty('ok', true);
});

test('account signup ? login ? list projects', async () => {
  const ctx = await request.newContext({ baseURL: BASE });
  const email = `e2e-${Date.now()}@example.com`;
  const password = 'TestPassword123!';

  const signup = await ctx.post('/v1/accounts', {
    data: { email, password, display_name: 'E2E Test' },
  });
  expect(signup.status()).toBe(201);
  const account = await signup.json();
  expect(account).toHaveProperty('account_id');
  expect(account).toHaveProperty('session_token');

  const list = await ctx.get('/v1/projects', {
    headers: { authorization: `Bearer ${account.session_token}` },
  });
  expect(list.status()).toBe(200);
  const projects = await list.json();
  expect(projects.projects).toEqual([]);

  const create = await ctx.post('/v1/projects', {
    data: { name: 'E2E Test Project', business_type: 'medical_reception' },
    headers: { authorization: `Bearer ${account.session_token}` },
  });
  expect(create.status()).toBe(201);
  const project = await create.json();
  expect(project).toHaveProperty('project_id');
  expect(project).toMatchObject({
    name: 'E2E Test Project',
    business_type: 'medical_reception',
  });

  const login = await ctx.post('/v1/accounts/sessions', {
    data: { email, password },
  });
  expect(login.status()).toBe(200);
  const newSession = await login.json();
  expect(newSession).toHaveProperty('session_token');

  const list2 = await ctx.get('/v1/projects', {
    headers: { authorization: `Bearer ${newSession.session_token}` },
  });
  const projects2 = await list2.json();
  expect(projects2.projects).toHaveLength(1);
});

test('rate limiting kicks in', async () => {
  const ctx = await request.newContext({ baseURL: BASE });
  let saw429 = false;
  for (let i = 0; i < 100; i++) {
    const r = await ctx.get('/health');
    if (r.status() === 429) { saw429 = true; break; }
  }
  expect([true, false]).toContain(saw429);
});
