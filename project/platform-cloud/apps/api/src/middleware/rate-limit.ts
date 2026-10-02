import type { Context, Next } from "hono";

interface Bucket {
  count: number;
  resetAt: number;
}

const memory = new Map<string, Bucket>();

export function rateLimit(opts: { perAccountPerMin: number; perIpPerMin: number }) {
  const windowMs = 60_000;
  return async (c: Context, next: Next) => {
    const accountId = (c.get("accountId") as string | undefined) ?? "anonymous";
    const ip =
      c.req.header("cf-connecting-ip") ??
      c.req.header("x-forwarded-for") ??
      "0.0.0.0";
    const now = Date.now();

    const keys = [
      { k: "acct:" + accountId, limit: opts.perAccountPerMin },
      { k: "ip:" + ip, limit: opts.perIpPerMin },
    ];

    for (const { k, limit } of keys) {
      let cur = memory.get(k);
      if (!cur || cur.resetAt < now) {
        cur = { count: 0, resetAt: now + windowMs };
        memory.set(k, cur);
      }
      if (cur.count >= limit) {
        return c.json(
          { error: { category: "rate_limited", message: "too many requests" } },
          429,
        );
      }
      cur.count++;
    }

    await next();
  };
}
