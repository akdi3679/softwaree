import { desc, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { db, readDb } from "../db/client";
import { accounts } from "../db/schema/accounts";
import { devices } from "../db/schema/devices";
import { planSubscriptions } from "../db/schema/plans";
import { users } from "../db/schema/users";
import { auditEntries } from "../db/schema/audit";
import { STRIPE_ENABLED, stripe } from "../billing/stripe";

const app = new Hono();

app.get("/v1/portal/account", async (c) => {
  const accountId = (c.get as (k: string) => unknown)("accountId");
  if (typeof accountId !== "string") return c.json({ error: "unauthorized" }, 401);
  const rows = await readDb().select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
  const account = rows[0];
  if (!account) return c.json({ error: "not_found" }, 404);
  return c.json(account);
});

app.get("/v1/portal/team", async (c) => {
  const accountId = (c.get as (k: string) => unknown)("accountId");
  if (typeof accountId !== "string") return c.json({ error: "unauthorized" }, 401);
  const team = await readDb().select().from(users).where(eq(users.accountId, accountId));
  return c.json({ team });
});

app.get("/v1/portal/devices", async (c) => {
  const accountId = (c.get as (k: string) => unknown)("accountId");
  if (typeof accountId !== "string") return c.json({ error: "unauthorized" }, 401);
  const teamUserIds = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.accountId, accountId));
  const devs = await readDb().select().from(devices).orderBy(desc(devices.createdAt));
  const allowed = new Set(teamUserIds.map((u) => u.id));
  const filtered = devs.filter((d) => allowed.has(d.ownerUserId));
  return c.json({ devices: filtered });
});

app.get("/v1/portal/invoices", async (c) => {
  const accountId = (c.get as (k: string) => unknown)("accountId");
  if (typeof accountId !== "string") return c.json({ error: "unauthorized" }, 401);
  if (!STRIPE_ENABLED || !stripe) return c.json({ invoices: [], stripe_disabled: true });
  const rows = await readDb().select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
  const account = rows[0];
  if (!account?.stripeCustomerId) return c.json({ invoices: [] });
  const invoices = await stripe.invoices.list({
    customer: account.stripeCustomerId,
    limit: 24,
  });
  return c.json({ invoices: invoices.data });
});

app.get("/v1/portal/subscription", async (c) => {
  const accountId = (c.get as (k: string) => unknown)("accountId");
  if (typeof accountId !== "string") return c.json({ error: "unauthorized" }, 401);
  const subs = await db
    .select()
    .from(planSubscriptions)
    .orderBy(desc(planSubscriptions.currentPeriodStart))
    .limit(1);
  return c.json({ subscription: subs[0] ?? null });
});

app.get("/v1/portal/audit", async (c) => {
  const accountId = (c.get as (k: string) => unknown)("accountId");
  if (typeof accountId !== "string") return c.json({ error: "unauthorized" }, 401);

  const teamUserIds = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.accountId, accountId));

  if (teamUserIds.length === 0) return c.json({ entries: [] });

  const ids = teamUserIds.map((u) => u.id);
  const entries = await db
    .select()
    .from(auditEntries)
    .where(inArray(auditEntries.actorUserId, ids))
    .orderBy(desc(auditEntries.occurredAt))
    .limit(100);

  return c.json({ entries });
});

export const portalRoutes = app;