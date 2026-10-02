import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { modules, moduleVersions } from "../db/schema/modules";

export interface ReviewAction {
  module_id: string;
  version: string;
  action: "approve" | "reject";
  reason?: string;
  reviewer_id: string;
}

export async function review(action: ReviewAction): Promise<void> {
  const now = new Date();
  const status = action.action === "approve" ? "published" : "rejected";

  const mods = await db
    .select({ id: modules.id })
    .from(modules)
    .where(eq(modules.moduleId, action.module_id))
    .limit(1);
  const modRow = mods[0];
  if (!modRow) throw new Error("module not found");

  await db
    .update(moduleVersions)
    .set({
      reviewStatus: status,
      reviewReason: action.reason ?? null,
      reviewedAt: now,
      reviewerId: action.reviewer_id,
    })
    .where(
      and(
        eq(moduleVersions.moduleId, modRow.id),
        eq(moduleVersions.version, action.version),
      ),
    );

  if (action.action === "approve") {
    await db
      .update(modules)
      .set({ reviewStatus: "published" })
      .where(eq(modules.id, modRow.id));
  }
}

export async function automatedReview(
  _moduleId: string,
  _version: string,
): Promise<{ passed: boolean; issues: string[] }> {
  // Wasmtime sandbox pass runs in a separate worker (Session 24).
  return { passed: true, issues: [] };
}