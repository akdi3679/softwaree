import type { Context, Next } from "hono";
import { appendAudit } from "./chain";

export async function auditMiddleware(c: Context, next: Next) {
  const method = c.req.method;
  const path = c.req.path;

  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    await next();
    return;
  }
  if (path.startsWith("/v1/accounts/sessions")) {
    await next();
    return;
  }
  if (path === "/health" || path === "/metrics") {
    await next();
    return;
  }

  const start = Date.now();
  await next();
  const elapsedMs = Date.now() - start;

  const ip =
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-forwarded-for") ??
    null;
  const accountId = (c.get("accountId") as string | undefined) ?? null;
  const deviceId = (c.get("deviceId") as string | undefined) ?? null;

  try {
    await appendAudit({
      category: "http",
      action: method + " " + path,
      actorUserId: accountId,
      actorDeviceId: deviceId,
      actorIp: ip,
      targetType: null,
      targetId: null,
      projectId: null,
      result: c.res.status < 400 ? "success" : "failure",
      details: { elapsedMs, status: c.res.status },
    });
  } catch (e) {
    // Audit failures must never break the request
    console.error("[audit] append failed", e);
  }
}
