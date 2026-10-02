import { and, desc, eq, gte, like, lte } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import { auditEntries } from "../db/schema/audit";
import { sessions } from "../db/schema/sessions";

const SupportSearchSchema = z.object({
  actor_user_id: z.string().optional(),
  project_id: z.string().optional(),
  action: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export const supportRoutes = new Hono()
  .get("/v1/support/audit/search", async (c) => {
    const role = (c.get as (k: string) => unknown)("role");
    if (role !== "ops" && role !== "admin") {
      return c.json({ error: "not_authorized" }, 403);
    }
    const params = SupportSearchSchema.parse(c.req.query());
    const conditions = [];
    if (params.actor_user_id) {
      conditions.push(eq(auditEntries.actorUserId, params.actor_user_id));
    }
    if (params.project_id) conditions.push(eq(auditEntries.projectId, params.project_id));
    if (params.action) conditions.push(like(auditEntries.action, `%${params.action}%`));
    if (params.from) conditions.push(gte(auditEntries.occurredAt, new Date(params.from)));
    if (params.to) conditions.push(lte(auditEntries.occurredAt, new Date(params.to)));

    const rows = await db
      .select()
      .from(auditEntries)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(auditEntries.occurredAt))
      .limit(params.limit)
      .offset(params.offset);
    return c.json({ entries: rows });
  })
  .get("/v1/support/sessions/:user_id", async (c) => {
    const role = (c.get as (k: string) => unknown)("role");
    if (role !== "ops" && role !== "admin") {
      return c.json({ error: "not_authorized" }, 403);
    }
    const userId = c.req.param("user_id");
    const rows = await db.select().from(sessions).where(eq(sessions.userId, userId));
    return c.json({ sessions: rows });
  });