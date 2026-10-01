# TASK ID: CONTRACT-088.1
# TITLE: Add contract: feature flag evaluation
# STATUS: pending
# DEPENDENCIES: ADMIN-052.2
# ALLOWED FILES: product/contracts/src/feature_flags/evaluate.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Rollout rules: percentage, segments, allowed plans.

## REQUIRED IMPLEMENTATION

Create `product/contracts/src/feature_flags/evaluate.ts`:

```typescript
export type FeatureFlag = {
  name: string;
  enabled: boolean;
  rollout_percentage?: number;     // 0-100
  segments?: string[];             // e.g. ['beta-testers']
  plans?: string[];                // e.g. ['enterprise']
  min_users?: number;              // project must have at least N users
};

export type EvalContext = {
  user_id: string;
  plan: string;
  segments: string[];
  project_user_count: number;
};

export function isFeatureEnabled(flag: FeatureFlag, ctx: EvalContext): boolean {
  if (!flag.enabled) return false;
  if (flag.plans && !flag.plans.includes(ctx.plan)) return false;
  if (flag.segments && !flag.segments.some((s) => ctx.segments.includes(s))) return false;
  if (flag.min_users && ctx.project_user_count < flag.min_users) return false;
  if (flag.rollout_percentage !== undefined) {
    // Stable hash: same user_id always lands in the same bucket
    const h = simpleHash(`${flag.name}:${ctx.user_id}`);
    return h < flag.rollout_percentage;
  }
  return true;
}

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  // Map to 0-100
  return Math.abs(h) % 100;
}
```

## TESTS

```bash
cd product
test -f contracts/src/feature_flags/evaluate.ts || { echo "FAIL"; exit 1; }
grep -q "isFeatureEnabled" contracts/src/feature_flags/evaluate.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
