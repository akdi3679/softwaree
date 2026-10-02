# Feature flags

We use feature flags for staged rollouts, A/B tests, and kill switches.

## Flag types

| Type | Lifecycle | Example |
|---|---|---|
| release | Permanent; one major version | v2.offline_writes |
| ops | Short-term kill switch | kill.module_install |
| experiment | A/B test; bounded | experiment.new_dashboard |
| plan | Per-plan entitlement | enterprise.multi_admin |

## Where flags live

- release and plan: Cloud feature_flags table, synced to Admin on each heartbeat.
- ops and experiment: Cloud only, queried live.

## Flag schema (TypeScript)

    interface FeatureFlag {
      key: string;
      type: "release" | "ops" | "experiment" | "plan";
      enabled: boolean;
      rollout_percentage?: number;
      segments?: string[];
      expires_at?: string;
      reason: string;
    }

## Rollout strategy

1. Add flag as experiment, enabled false.
2. Enable for internal users only via segments.
3. Bump rollout_percentage 5 to 25 to 50 to 100 over a week.
4. After 30 clean days, set enabled true permanently and remove the gate.

## Kill switch

Any feature can be killed by setting enabled false. The check is at the boundary, so killing is instant.

## What we do not do

- No per-user flags. Per-account only.
- No client-side evaluation. Server decides.
- No non-engineer flag UI. Platform team only.

## Performance

Flag check cached in Admin SQLite for 60 seconds. Cloud flag table is small.

## Audit

Every flag change is audited with actor and reason.
