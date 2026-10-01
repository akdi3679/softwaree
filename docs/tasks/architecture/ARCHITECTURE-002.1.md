# TASK ID: ARCHITECTURE-002.1
# TITLE: Add 05-FEATURES (feature flag system)
# STATUS: pending
# DEPENDENCIES: OBS-002.3
# ALLOWED FILES: /workspace/docs/architecture/05-FEATURES.md, product/packages/contracts/src/feature-flags.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Document the feature flag system. Used for staged rollouts, A/B, kill switches.

## REQUIRED IMPLEMENTATION

Create `/workspace/docs/architecture/05-FEATURES.md`:

```markdown
# Feature flags

We use feature flags for staged rollouts, A/B tests, and kill switches.

## Flag types

| Type | Lifecycle | Example |
|------|-----------|---------|
| `release` | Permanent; one major version's lifetime | `v2.offline_writes` |
| `ops` | Short-term; used for ops | `kill.module_install` |
| `experiment` | A/B test; bounded time | `experiment.new_dashboard` |
| `plan` | Per-plan entitlement | `enterprise.multi_admin` |

## Where flags live

- `release` + `plan`: in the Cloud's `feature_flags` table, replicated to the Admin on each request
- `ops` + `experiment`: in the Cloud only, queried live

## Flag schema

```typescript
interface FeatureFlag {
  key: string;             // "experiment.new_dashboard"
  type: 'release' | 'ops' | 'experiment' | 'plan';
  enabled: boolean;
  rollout_percentage?: number;  // 0-100
  segments?: string[];          // account_id, plan, region
  expires_at?: string;          // for experiments
  reason: string;               // why this flag exists
}
```

## How a feature is gated

```typescript
import { isFeatureEnabled } from '@product/contracts';

if (await isFeatureEnabled('v2.offline_writes', { accountId, plan })) {
  // ... new code path
}
```

## Rollout strategy

For a new feature:
1. Add the flag as `experiment` with `enabled: false`
2. Enable for internal users (account_id in `segments`)
3. Bump `rollout_percentage` to 5%, 25%, 50%, 100% over a week
4. After 30 days with no issues, set `enabled: true` permanently and remove the gate

## Kill switch

Any feature can be killed by setting `enabled: false`. The check is at the boundary, so killing a feature is instant.

## What we don't do

- We don't have per-user flags. Per-account only.
- We don't have client-side flag evaluation. The server decides.
- We don't have a flag UI for non-engineers. Only the platform team can change flags.

## Performance

Flag check is cached in the Admin's local SQLite for 60 seconds. The Cloud's flag table is small (a few hundred rows max), so lookups are fast.

## Audit

Every flag change is audited. We can see who changed what and when.
```

Create `product/packages/contracts/src/feature-flags.ts`:

```typescript
export type FeatureFlagType = 'release' | 'ops' | 'experiment' | 'plan';

export interface FeatureFlag {
  key: string;
  type: FeatureFlagType;
  enabled: boolean;
  rollout_percentage?: number;
  segments?: string[];
  expires_at?: string;
  reason: string;
}

export interface FlagContext {
  accountId: string;
  plan: string;
  deviceId?: string;
}

const CACHE = new Map<string, { value: boolean; expiresAt: number }>();

/** Check if a feature is enabled. Caches for 60s. */
export async function isFeatureEnabled(
  key: string,
  ctx: FlagContext,
  fetcher: () => Promise<FeatureFlag>,
): Promise<boolean> {
  const cached = CACHE.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const flag = await fetcher();
  let enabled = flag.enabled;
  if (enabled && flag.rollout_percentage !== undefined) {
    const hash = simpleHash(ctx.accountId + key);
    enabled = (hash % 100) < flag.rollout_percentage;
  }
  if (enabled && flag.segments) {
    enabled = flag.segments.includes(ctx.accountId) || flag.segments.includes(ctx.plan);
  }
  CACHE.set(key, { value: enabled, expiresAt: Date.now() + 60_000 });
  return enabled;
}

function simpleHash(s: string): number {
  let h = 0;
  for (const c of s) h = ((h * 31) + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}
```

## TESTS

```bash
cd product
test -f packages/contracts/src/feature-flags.ts || { echo "FAIL"; exit 1; }
grep -q "isFeatureEnabled" packages/contracts/src/feature-flags.ts || { echo "FAIL"; exit 1; }
cd /workspace
test -f docs/architecture/05-FEATURES.md || { echo "FAIL: no doc"; exit 1; }
echo "OK"
```
