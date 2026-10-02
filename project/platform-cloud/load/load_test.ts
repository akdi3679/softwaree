// k6 load test for the Cloud.
// Run: k6 run --vus 10000 --duration 60s load/load_test.ts

import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:8787";

export const options = {
  stages: [
    { duration: "10s", target: 1000 },
    { duration: "20s", target: 10000 },
    { duration: "30s", target: 10000 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<200", "p(99)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const res = http.get(BASE + "/v1/modules");
  check(res, {
    "status is 200 or 401": (r) => r.status === 200 || r.status === 401,
    "latency < 500ms": (r) => r.timings.duration < 500,
  });
  sleep(1);
}
