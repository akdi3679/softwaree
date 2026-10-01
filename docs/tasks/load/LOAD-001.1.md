# TASK ID: LOAD-001.1
# TITLE: Add Cloud load test (10K concurrent Users)
# STATUS: pending
# DEPENDENCIES: CHAOS-001.3
# ALLOWED FILES: platform-cloud/load/load_test.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Load test: simulate 10K concurrent Users syncing.

## REQUIRED IMPLEMENTATION

Add to `package.json`:
```json
"devDependencies": {
  "k6": "^0.50.0"
}
```

Create `platform-cloud/load/load_test.ts`:

```typescript
// k6 load test for the Cloud
// Run with: k6 run --vus 10000 --duration 60s load/load_test.ts

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:8787';

export const options = {
  stages: [
    { duration: '10s', target: 1000 },   // ramp up to 1K
    { duration: '20s', target: 10000 },  // ramp up to 10K
    { duration: '30s', target: 10000 },  // hold at 10K
    { duration: '10s', target: 0 },      // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  // Simulate a User syncing
  const res = http.get(`${BASE}/v1/modules`);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'latency < 200ms': (r) => r.timings.duration < 200,
  });
  sleep(1);
}
```

Add a CI step:

```yaml
# .github/workflows/load.yml
name: load
on:
  schedule: [cron: '0 2 * * 0']  # weekly
jobs:
  k6:
    runs-on: ubuntu-22.04
    steps:
      - uses: actions/checkout@v4
      - run: docker run --rm -v "$PWD/platform-cloud:/scripts" grafana/k6 run /scripts/load/load_test.ts
```

## TESTS

```bash
cd platform-cloud
test -f load/load_test.ts || { echo "FAIL"; exit 1; }
grep -q "k6" load/load_test.ts || { echo "FAIL: no k6"; exit 1; }
echo "OK"
```
