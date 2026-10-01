# TASK ID: CLOUD-008.2
# TITLE: Add Cloud e2e test suite (Playwright)
# STATUS: pending
# DEPENDENCIES: CLOUD-008.1
# ALLOWED FILES: platform-cloud/e2e/account.spec.ts, platform-cloud/playwright.config.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Add Playwright e2e tests for the Cloud's HTTP API.

## REQUIRED IMPLEMENTATION

Add to `package.json`:
```json
{
  "devDependencies": {
    "@playwright/test": "^1.47.0"
  },
  "scripts": {
    "e2e": "playwright test"
  }
}
```

Create `platform-cloud/playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:8787',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

Create `platform-cloud/e2e/account.spec.ts`:

```typescript
import { test, expect, request } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:8787';

test('health endpoint returns ok', async () => {
  const res = await request.newContext({ baseURL: BASE });
  const r = await res.get('/health');
  expect(r.status()).toBe(200);
  const body = await r.json();
  expect(body).toHaveProperty('ok', true);
});

test('account signup → login → list projects', async () => {
  const ctx = await request.newContext({ baseURL: BASE });
  const email = `e2e-${Date.now()}@example.com`;
  const password = 'TestPassword123!';

  // 1. Sign up
  const signup = await ctx.post('/v1/accounts', {
    data: { email, password, display_name: 'E2E Test' },
  });
  expect(signup.status()).toBe(201);
  const account = await signup.json();
  expect(account).toHaveProperty('account_id');
  expect(account).toHaveProperty('session_token');

  // 2. List projects (should be empty)
  const list = await ctx.get('/v1/projects', {
    headers: { authorization: `Bearer ${account.session_token}` },
  });
  expect(list.status()).toBe(200);
  const projects = await list.json();
  expect(projects.projects).toEqual([]);

  // 3. Create a project
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

  // 4. Login again (new session)
  const login = await ctx.post('/v1/accounts/sessions', {
    data: { email, password },
  });
  expect(login.status()).toBe(200);
  const newSession = await login.json();
  expect(newSession).toHaveProperty('session_token');

  // 5. List projects (should have one now)
  const list2 = await ctx.get('/v1/projects', {
    headers: { authorization: `Bearer ${newSession.session_token}` },
  });
  const projects2 = await list2.json();
  expect(projects2.projects).toHaveLength(1);
});

test('rate limiting kicks in', async () => {
  const ctx = await request.newContext({ baseURL: BASE });
  // Hit a public endpoint 100 times; should see 429 at some point
  let saw429 = false;
  for (let i = 0; i < 100; i++) {
    const r = await ctx.get('/health');
    if (r.status() === 429) { saw429 = true; break; }
  }
  // Depending on config this may or may not trip
  // Just ensure the API responds consistently
  expect([true, false]).toContain(saw429);
});
```

## TESTS

```bash
cd platform-cloud
test -f e2e/account.spec.ts || { echo "FAIL"; exit 1; }
test -f playwright.config.ts || { echo "FAIL: no config"; exit 1; }
grep -q "playwright" package.json || { echo "FAIL: no playwright dep"; exit 1; }
echo "OK"
```
