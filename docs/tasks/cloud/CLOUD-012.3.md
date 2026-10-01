# TASK ID: CLOUD-012.3
# TITLE: Create project routes
# STATUS: pending
# DEPENDENCIES: CLOUD-012.2
# ALLOWED FILES: platform-cloud/apps/api/src/routes/projects.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Create the Hono route handlers for project create/list/activate/suspend.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/apps/api/src/routes/projects.ts`:

```typescript
import { Hono } from 'hono';
import { z } from 'zod';
import { createProject, activateProject, listProjectsForUser, getProjectById, suspendProject, archiveProject } from '../services/project';
import { appendAudit } from '../services/audit';
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
  await appendAudit({
    category: 'project',
    action: 'project.created',
    actorUserId: body.ownerUserId,
    targetType: 'project',
    targetId: project.projectId,
    result: 'success',
    details: { businessType: body.businessType, planId: body.planId },
  });
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
  await appendAudit({
    category: 'project',
    action: 'project.activated',
    targetType: 'project',
    targetId: projectId,
    result: 'success',
  });
  return c.json({ projectId: project.projectId, state: project.state });
});

router.post('/v1/projects/:projectId/suspend', async (c) => {
  const projectId = c.req.param('projectId');
  const reason = c.req.query('reason') ?? 'manual';
  const project = await suspendProject(projectId, reason);
  await appendAudit({
    category: 'project',
    action: 'project.suspended',
    targetType: 'project',
    targetId: projectId,
    result: 'success',
    details: { reason },
  });
  return c.json({ projectId: project.projectId, state: project.state });
});

router.post('/v1/projects/:projectId/archive', async (c) => {
  const projectId = c.req.param('projectId');
  const project = await archiveProject(projectId);
  await appendAudit({
    category: 'project',
    action: 'project.archived',
    targetType: 'project',
    targetId: projectId,
    result: 'success',
  });
  return c.json({ projectId: project.projectId, state: project.state });
});

export default router;
```

## TESTS

```bash
cd platform-cloud
test -f apps/api/src/routes/projects.ts || { echo "FAIL"; exit 1; }
pnpm --filter @cloud/api typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
