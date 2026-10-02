export type FeatureFlagType = "release" | "ops" | "experiment" | "plan";

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
    enabled = hash % 100 < flag.rollout_percentage;
  }
  if (enabled && flag.segments) {
    enabled =
      flag.segments.includes(ctx.accountId) || flag.segments.includes(ctx.plan);
  }
  CACHE.set(key, { value: enabled, expiresAt: Date.now() + 60_000 });
  return enabled;
}

function simpleHash(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}
