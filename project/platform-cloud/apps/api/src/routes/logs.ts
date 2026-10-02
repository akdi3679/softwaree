import { Hono } from "hono";
import { z } from "zod";

const LogBatchSchema = z.object({
  logs: z.array(
    z.object({
      timestamp: z.string(),
      level: z.string(),
      target: z.string(),
      message: z.string(),
      fields: z.unknown().optional(),
    }),
  ),
});

export const logIngestRoutes = new Hono().post("/v1/logs/ingest", async (c) => {
  const accountId = (c.get as (k: string) => unknown)("accountId");
  if (typeof accountId !== "string" || !accountId) {
    return c.json({ error: "unauthorized" }, 401);
  }
  const body = LogBatchSchema.parse(await c.req.json());
  const lokiUrl = process.env.LOKI_URL;
  if (lokiUrl) {
    const streams = [
      {
        stream: { account_id: accountId, job: "admin" },
        values: body.logs.map((l) => [
          String(new Date(l.timestamp).getTime() * 1_000_000),
          JSON.stringify({
            level: l.level,
            target: l.target,
            message: l.message,
            ...((l.fields as object) ?? {}),
          }),
        ]),
      },
    ];
    const r = await fetch(lokiUrl + "/loki/api/v1/push", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ streams }),
    });
    if (!r.ok) {
      return c.json({ error: "loki_push_failed", status: r.status }, 502);
    }
  }
  return c.json({ accepted: body.logs.length });
});
