import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client";
import { accounts } from "../db/schema/accounts";
import { sessions } from "../db/schema/sessions";
import { users } from "../db/schema/users";

export const gdprRoutes = new Hono()
  .post("/v1/accounts/:id/gdpr/export", async (c) => {
    const id = c.req.param("id");
    const authAccountId = (c.get as (k: string) => unknown)("accountId");
    if (typeof authAccountId !== "string" || authAccountId !== id) {
      return c.json({ error: "not_authorized" }, 403);
    }
    const account = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
    const myUsers = await db.select().from(users).where(eq(users.accountId, id));
    const mySessions = await db.select().from(sessions).where(eq(sessions.userId, id));
    return c.json({
      exported_at: new Date().toISOString(),
      account: account[0] ?? null,
      users: myUsers,
      sessions: mySessions,
      note: "Project business data is held on the Admin device; request it there.",
    });
  })
  .post("/v1/accounts/:id/gdpr/delete", async (c) => {
    const id = c.req.param("id");
    const authAccountId = (c.get as (k: string) => unknown)("accountId");
    if (typeof authAccountId !== "string" || authAccountId !== id) {
      return c.json({ error: "not_authorized" }, 403);
    }
    await db.delete(sessions).where(eq(sessions.userId, id));
    await db.delete(users).where(eq(users.accountId, id));
    await db.delete(accounts).where(eq(accounts.id, id));
    return c.json({ deleted: true, deleted_at: new Date().toISOString() });
  });