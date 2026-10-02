import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client";
import { modules, moduleVersions } from "../db/schema/modules";

export const marketplaceRoutes = new Hono()
  .get("/v1/marketplace/modules", async (c) => {
    const category = c.req.query("category");
    const conditions = [eq(modules.reviewStatus, "published")];
    if (category) conditions.push(eq(modules.category, category));
    const rows = await db
      .select()
      .from(modules)
      .where(and(...conditions))
      .orderBy(desc(modules.createdAt));
    return c.json({ modules: rows });
  })
  .get("/v1/marketplace/modules/:id", async (c) => {
    const id = c.req.param("id");
    const mods = await db
      .select()
      .from(modules)
      .where(eq(modules.moduleId, id))
      .limit(1);
    const mod = mods[0];
    if (!mod) return c.json({ error: "not_found" }, 404);
    const versions = await db
      .select()
      .from(moduleVersions)
      .where(
        and(
          eq(moduleVersions.moduleId, mod.id),
          eq(moduleVersions.reviewStatus, "published"),
        ),
      )
      .orderBy(desc(moduleVersions.publishedAt));
    return c.json({ module: mod, versions });
  })
  .get("/v1/marketplace/modules/:id/versions/:v/install", async (c) => {
    const { id, v } = c.req.param();
    const projectId = c.req.query("project_id");
    const deviceId = c.req.query("device_id");
    if (!projectId || !deviceId) {
      return c.json({ error: "project_id and device_id required" }, 400);
    }
    const mods = await db
      .select({ id: modules.id })
      .from(modules)
      .where(eq(modules.moduleId, id))
      .limit(1);
    const mod = mods[0];
    if (!mod) return c.json({ error: "not_found" }, 404);
    const versions = await db
      .select()
      .from(moduleVersions)
      .where(
        and(
          eq(moduleVersions.moduleId, mod.id),
          eq(moduleVersions.version, v),
        ),
      )
      .limit(1);
    const ver = versions[0];
    if (!ver) return c.json({ error: "version_not_found" }, 404);
    return c.json({
      manifest: ver.manifest,
      binary: null, // Package path resolved by the module registry (Session 6).
      signatures: null,
      note: "Use /v1/modules/:id/versions/:v/package for the signed bundle.",
    });
  });