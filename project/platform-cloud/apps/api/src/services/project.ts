import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { projects, planSubscriptions } from '../db/schema';

export async function createProject(input: {
  ownerUserId: string;
  name: string;
  businessType: string;
  planId: string;
}) {
  const [project] = await db
    .insert(projects)
    .values({
      ownerUserId: input.ownerUserId,
      name: input.name,
      businessType: input.businessType,
      planId: input.planId,
      state: 'creating',
    })
    .returning();
  if (!project) throw new Error('project insert failed');
  return project;
}

export async function listProjectsForUser(ownerUserId: string) {
  return db.select().from(projects).where(eq(projects.ownerUserId, ownerUserId));
}

export async function getProjectById(projectId: string) {
  const rows = await db.select().from(projects).where(eq(projects.projectId, projectId)).limit(1);
  return rows[0] ?? null;
}

export async function activateProject(projectId: string, adminDeviceId: string) {
  const rows = await db
    .update(projects)
    .set({ state: 'active', currentAdminDeviceId: adminDeviceId, activatedAt: new Date() })
    .where(eq(projects.projectId, projectId))
    .returning();
  return rows[0];
}

export async function suspendProject(projectId: string, reason: string) {
  const rows = await db
    .update(projects)
    .set({ state: 'suspended', suspendedAt: new Date() })
    .where(eq(projects.projectId, projectId))
    .returning();
  return rows[0];
}

export async function archiveProject(projectId: string) {
  const rows = await db
    .update(projects)
    .set({ state: 'archived', archivedAt: new Date(), archivedRetentionUntil: new Date(Date.now() + 30*24*60*60*1000) })
    .where(eq(projects.projectId, projectId))
    .returning();
  return rows[0];
}
