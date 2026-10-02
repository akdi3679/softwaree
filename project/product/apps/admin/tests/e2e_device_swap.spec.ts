// E2E device swap ceremony test.
// Run with: pnpm exec playwright test tests/e2e_device_swap.spec.ts
//
// NOTE: This test is a scaffold. It exercises the HTTP contract of the Cloud
// replacement flow. It will skip when the Cloud is not reachable.

import { test, expect } from "@playwright/test";

const CLOUD = process.env.CLOUD_URL ?? "http://localhost:8787";

async function cloudUp(): Promise<boolean> {
  try {
    const r = await fetch(`${CLOUD}/health`);
    return r.ok;
  } catch {
    return false;
  }
}

test.describe("device swap", () => {
  test("cloud replacement endpoint rejects unknown ticket", async () => {
    if (!(await cloudUp())) {
      test.skip(true, "Cloud not running");
      return;
    }
    const r = await fetch(`${CLOUD}/v1/projects/proj_test/complete_replacement`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ticket: "bogus" }),
    });
    expect([400, 401, 403, 404]).toContain(r.status);
  });

  test("begin_replacement requires auth", async () => {
    if (!(await cloudUp())) {
      test.skip(true, "Cloud not running");
      return;
    }
    const r = await fetch(`${CLOUD}/v1/admin/begin_replacement`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ project_id: "proj_test", reason: "lost" }),
    });
    expect([401, 403, 404]).toContain(r.status);
  });
});