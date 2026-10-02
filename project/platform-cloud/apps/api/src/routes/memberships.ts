import { Hono } from 'hono';
import { z } from 'zod';
import { createInvitation, acceptInvitation, revokeInvitation } from '../services/invitation';
import { approveMembership, changeRole, removeMembership, listMembershipsForProject } from '../services/membership';
import { HttpError } from '../middleware/error';
import { ErrorCategory } from '@product/contracts';
import { rotateUserSessions } from '../auth/session-rotation';

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
  return c.json({ invitationId: invitation.invitationId, token, expiresAt: invitation.expiresAt }, 201);
});

const AcceptSchema = z.object({
  token: z.string().min(1),
  acceptingUserId: z.string().uuid(),
});

router.post('/v1/invitations/accept', async (c) => {
  const body = AcceptSchema.parse(await c.req.json());
  const membership = await acceptInvitation(body.token, body.acceptingUserId);
  if (!membership) {
    throw new HttpError(404, ErrorCategory.NOT_FOUND, 'INVITATION_INVALID', 'Invitation not found or expired');
  }
  return c.json({ membershipId: membership.id, state: membership.state });
});

router.post('/v1/invitations/:invitationId/revoke', async (c) => {
  const invitationId = c.req.param('invitationId');
  const reason = c.req.query('reason') ?? 'manual';
  await revokeInvitation(invitationId, reason);
  return c.json({ ok: true });
});

const ApproveSchema = z.object({
  approvedByUserId: z.string().uuid(),
});

router.post('/v1/memberships/:membershipId/approve', async (c) => {
  const membershipId = c.req.param('membershipId');
  const body = ApproveSchema.parse(await c.req.json());
  const membership = await approveMembership(membershipId, body.approvedByUserId);
  if (!membership) {
    throw new HttpError(404, ErrorCategory.NOT_FOUND, 'MEMBERSHIP_NOT_PENDING', 'Membership not found or not pending');
  }
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
  if (!membership) {
    throw new HttpError(404, ErrorCategory.NOT_FOUND, 'MEMBERSHIP_NOT_FOUND', 'Membership not found');
  }
  // A role change invalidates every active session for the affected user,
  // forcing them to re-authenticate and pick up the new permissions.
  await rotateUserSessions(membership.userId);
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
  const memberships = await listMembershipsForProject(projectId);
  return c.json({ memberships });
});

export default router;
