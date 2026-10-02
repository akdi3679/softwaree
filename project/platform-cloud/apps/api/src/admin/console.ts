import { count, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client";
import { accounts } from "../db/schema/accounts";
import { auditEntries } from "../db/schema/audit";
import { modules } from "../db/schema/modules";

function requireOps(c: { get: (k: string) => unknown }): boolean {
  const role = c.get("role");
  return role === "ops" || role === "admin";
}

export const adminConsoleRoutes = new Hono()
  .get("/v1/admin/accounts", async (c) => {
    if (!requireOps(c)) return c.json({ error: "not_authorized" }, 403);
    const limit = Number.parseInt(c.req.query("limit") ?? "100", 10);
    const offset = Number.parseInt(c.req.query("offset") ?? "0", 10);
    const rows = await db
      .select()
      .from(accounts)
      .orderBy(desc(accounts.createdAt))
      .limit(limit)
      .offset(offset);
    return c.json({ accounts: rows });
  })
  .post("/v1/admin/accounts/:id/suspend", async (c) => {
    if (!requireOps(c)) return c.json({ error: "not_authorized" }, 403);
    const id = c.req.param("id");
    await db.update(accounts).set({ status: "suspended" }).where(eq(accounts.id, id));
    return c.json({ suspended: true });
  })
  .post("/v1/admin/accounts/:id/restore", async (c) => {
    if (!requireOps(c)) return c.json({ error: "not_authorized" }, 403);
    const id = c.req.param("id");
    await db.update(accounts).set({ status: "active" }).where(eq(accounts.id, id));
    return c.json({ restored: true });
  })
  .get("/v1/admin/stats", async (c) => {
    if (!requireOps(c)) return c.json({ error: "not_authorized" }, 403);
    const accountCount = await db.select({ count: count() }).from(accounts);
    const moduleCount = await db.select({ count: count() }).from(modules);
    const planDistribution = await db
      .select({ plan: accounts.plan, count: count() })
      .from(accounts)
      .groupBy(accounts.plan);
    return c.json({
      total_accounts: accountCount[0]?.count ?? 0,
      total_modules: moduleCount[0]?.count ?? 0,
      plan_distribution: planDistribution,
    });
  })
  .get("/v1/admin/audit", async (c) => {
    if (!requireOps(c)) return c.json({ error: "not_authorized" }, 403);
    const limit = Number.parseInt(c.req.query("limit") ?? "100", 10);
    const rows = await db
      .select()
      .from(auditEntries)
      .orderBy(desc(auditEntries.occurredAt))
      .limit(limit);
    return c.json({ entries: rows });
  });