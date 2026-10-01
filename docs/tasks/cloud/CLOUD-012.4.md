# TASK ID: CLOUD-012.4
# TITLE: Create membership and invitation routes
# STATUS: pending
# DEPENDENCIES: CLOUD-012.3
# ALLOWED FILES: platform-cloud/apps/api/src/routes/memberships.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Create the routes for invitations (create/accept/revoke) and memberships (approve/change role/remove).

## REQUIRED IMPLEMENTATION

Create `platform-cloud/apps/api/src/routes/memberships.ts`:

```typescript
import { Hono } from 'hono';
import { z } from 'zod';
import { createInvitation, acceptInvitation, revokeInvitation } from '../services/invitation';
import { approveMembership, changeRole, removeMembership, listMembershipsForProject } from '../services/membership';
import { appendAudit } from '../services/audit';
import { HttpError } from '../middleware/error';
import { ErrorCategory } from '@product/contracts';

const router = new Hono();

const CreateInvitationSchema = z.object({
  projectId: z.string().uuid(),
  invitedByUserId: z.string().uuid(),
  invitedEmail: z.string().email(),
  initialRole: z.string().min(1).max(64),
});

router.post('/v1/projects/:projectId/invitations', async (c) => {
  const projectId = c.req.param('projectId');
  const body = CreateInvitationSchema.parse({ ...(await c.req.json()), projectId });
  const { invitation, token } = await createInvitation(body);
  await appendAudit({
    category: 'project',
    action: 'project.invitation_sent',
    actorUserId: body.invitedByUserId,
    projectId,
    result: 'success',
    details: { invitedEmail: body.invitedEmail, role: body.initialRole },
  });
  // Return the plaintext token to the inviter (who sends it to the invitee out-of-band)
  return c.json({ invitationId: invitation.invitationId, token, expiresAt: invitation.expiresAt }, 201);
});

const AcceptInvitationSchema = z.object({
  token: z.string().min(1),
  acceptingUserId: z.string().uuid(),
});

router.post('/v1/invitations/accept', async (c) => {
  const body = AcceptInvitationSchema.parse(await c.req.json());
  const membership = await acceptInvitation(body.token, body.acceptingUserId);
  await appendAudit({
    category: 'project',
    action: 'project.invitation_accepted',
    actorUserId: body.acceptingUserId,
    projectId: membership.projectId,
    result: 'success',
  });
  return c.json({ membershipId: membership.id, state: membership.state });
});

router.post('/v1/invitations/:invitationId/revoke', async (c) => {
  const invitationId = c.req.param('invitationId');
  const reason = c.req.query('reason') ?? 'manual';
  await revokeInvitation(invitationId, reason);
  return c.json({ ok: true });
});

router.post('/v1/memberships/:membershipId/approve', async (c) => {
  const membershipId = c.req.param('membershipId');
  const { approvedByUserId } = z.object({ approvedByUserId: z.string().uuid() }).parse(await c.req.json());
  const membership = await approveMembership(membershipId, approvedByUserId);
  await appendAudit({
    category: 'project',
    action: 'project.membership_approved',
    actorUserId: approvedByUserId,
    projectId: membership.projectId,
    result: 'success',
  });
  return c.json({ membershipId: membership.id, state: membership.state });
});

const ChangeRoleSchema = z.object({
  newRole: z.string().min(1).max(64),
  changedByUserId: z.string().uuid(),
});

router.post('/v1/memberships/:membershipId/role', async (c) => {
  const membershipId = c.req.param('membershipId');
  const body = ChangeRoleSchema.parse(await c.req.json());
  const membership = await changeRole(membershipId, body.newRole, body.changedByUserId);
  await appendAudit({
    category: 'project',
    action: 'project.role_assigned',
    actorUserId: body.changedByUserId,
    projectId: membership.projectId,
    result: 'success',
    details: { newRole: body.newRole, userId: membership.userId },
  });
  return c.json({ membershipId: membership.id, currentRole: membership.currentRole });
});

const RemoveSchema = z.object({
  removedByUserId: z.string().uuid(),
  reason: z.string().min(1).max(256),
});

router.post('/v1/memberships/:membershipId/remove', async (c) => {
  const membershipId = c.req.param('membershipId');
  const body = RemoveSchema.parse(await c.req.json());
  await removeMembership(membershipId, body.removedByUserId, body.reason);
  return c.json({ ok: true });
});

router.get('/v1/projects/:projectId/memberships', async (c) => {
  const projectId = c.req.param('projectId');
  // projectId here is the UUID id, not the public id
  const memberships = await listMembershipsForProject(projectId);
  return c.json({ memberships });
});

export default router;
```

## TESTS

```bash
cd platform-cloud
test -f apps/api/src/routes/memberships.ts || { echo "FAIL"; exit 1; }
pnpm --filter @cloud/api typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
