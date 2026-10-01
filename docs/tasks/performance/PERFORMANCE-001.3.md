# TASK ID: PERFORMANCE-001.3
# TITLE: Add Cloud Postgres benchmark suite
# STATUS: pending
# DEPENDENCIES: PERFORMANCE-001.2
# ALLOWED FILES: platform-cloud/benches/api_bench.ts, platform-cloud/package.json
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Add benchmarks for the Cloud's hot API endpoints.

## REQUIRED IMPLEMENTATION

Add to `platform-cloud/package.json`:

```json
{
  "scripts": {
    "bench": "tsx benches/api_bench.ts"
  },
  "devDependencies": {
    "autocannon": "^7.15.0",
    "tsx": "^4.19.0"
  }
}
```

Create `platform-cloud/benches/api_bench.ts`:

```typescript
import autocannon from 'autocannon';

const BASE = process.env.BENCH_BASE_URL ?? 'http://localhost:8787';

interface BenchConfig {
  name: string;
  url: string;
  method: 'GET' | 'POST';
  body?: any;
  headers?: Record<string, string>;
  connections: number;
  duration: number;
}

const configs: BenchConfig[] = [
  { name: 'health', url: `${BASE}/health`, method: 'GET', connections: 10, duration: 10 },
  { name: 'list_modules', url: `${BASE}/v1/modules`, method: 'GET', connections: 50, duration: 10 },
];

async function getAuthToken(): Promise<string> {
  const res = await fetch(`${BASE}/v1/accounts/sessions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'bench@example.com', password: 'BenchPassword123!' }),
  });
  if (!res.ok) throw new Error(`auth failed: ${res.status}`);
  const data: any = await res.json();
  return data.session_token;
}

async function runOne(cfg: BenchConfig, token?: string) {
  const headers: Record<string, string> = { ...cfg.headers };
  if (token) headers['authorization'] = `Bearer ${token}`;
  if (cfg.body) headers['content-type'] = 'application/json';
  const result = await autocannon({
    url: cfg.url,
    method: cfg.method,
    body: cfg.body ? JSON.stringify(cfg.body) : undefined,
    headers,
    connections: cfg.connections,
    duration: cfg.duration,
  });
  return result;
}

async function main() {
  let token: string | undefined;
  try {
    token = await getAuthToken();
    console.log('auth ok');
  } catch (e) {
    console.warn('auth failed, running unauthenticated benches only');
  }

  for (const cfg of configs) {
    console.log(`\n== ${cfg.name} (${cfg.connections} conn, ${cfg.duration}s) ==`);
    const r = await runOne(cfg, token);
    console.log(`  requests: ${r.requests.total}`);
    console.log(`  p50: ${r.latency.p50}ms`);
    console.log(`  p99: ${r.latency.p99}ms`);
    console.log(`  errors: ${r.errors}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

## TESTS

```bash
cd platform-cloud
test -f benches/api_bench.ts || { echo "FAIL"; exit 1; }
grep -q "autocannon" package.json || { echo "FAIL: no autocannon"; exit 1; }
echo "OK"
```
