import { Hono } from 'hono';
import { z } from 'zod';
import { createProject, listProjectsForUser, getProjectById, activateProject, suspendProject, archiveProject } from '../services/project';
import { HttpError } from '../middleware/error';
import { ErrorCategory } from '@product/contracts';

const router = new Hono();

const CreateProjectSchema = z.object({
  ownerUserId: z.string().uuid(),
  name: z.string().min(1).max(256),
  businessType: z.enum(['medical_reception', 'food_lab', 'other']),
  planId: z.string().uuid(),
});

router.post('/v1/projects', async (c) => {
  const body = CreateProjectSchema.parse(await c.req.json());
  const project = await createProject(body);
  if (!project) {
    throw new HttpError(500, ErrorCategory.PERMANENT, 'PROJECT_CREATE_FAILED', 'Failed to create project');
  }
  return c.json({ projectId: project.projectId, state: project.state }, 201);
});

router.get('/v1/projects', async (c) => {
  const ownerUserId = c.req.query('ownerUserId');
  if (!ownerUserId) {
    throw new HttpError(400, ErrorCategory.VALIDATION, 'VALIDATION_OWNER_REQUIRED', 'ownerUserId query param required');
  }
  const projects = await listProjectsForUser(ownerUserId);
  return c.json({ projects });
});

router.get('/v1/projects/:projectId', async (c) => {
  const projectId = c.req.param('projectId');
  const project = await getProjectById(projectId);
  if (!project) {
    throw new HttpError(404, ErrorCategory.NOT_FOUND, 'PROJECT_NOT_FOUND', 'Project not found');
  }
  return c.json(project);
});

const ActivateSchema = z.object({
  adminDeviceId: z.string().uuid(),
});

router.post('/v1/projects/:projectId/activate', async (c) => {
  const projectId = c.req.param('projectId');
  const body = ActivateSchema.parse(await c.req.json());
  const project = await activateProject(projectId, body.adminDeviceId);
  if (!project) {
    throw new HttpError(404, ErrorCategory.NOT_FOUND, 'PROJECT_NOT_FOUND', 'Project not found');
  }
  return c.json({ projectId: project.projectId, state: project.state });
});

router.post('/v1/projects/:projectId/suspend', async (c) => {
  const projectId = c.req.param('projectId');
  const reason = c.req.query('reason') ?? 'manual';
  const project = await suspendProject(projectId, reason);
  if (!project) {
    throw new HttpError(404, ErrorCategory.NOT_FOUND, 'PROJECT_NOT_FOUND', 'Project not found');
  }
  return c.json({ projectId: project.projectId, state: project.state });
});

router.post('/v1/projects/:projectId/archive', async (c) => {
  const projectId = c.req.param('projectId');
  const project = await archiveProject(projectId);
  if (!project) {
    throw new HttpError(404, ErrorCategory.NOT_FOUND, 'PROJECT_NOT_FOUND', 'Project not found');
  }
  return c.json({ projectId: project.projectId, state: project.state });
});

export default router;
