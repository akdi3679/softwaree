import { and, eq, gt } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { db } from '../db/client';
import { invitations, memberships } from '../db/schema';
import { hashToken } from '../crypto/challenge';
import { HttpError } from '../middleware/error';
import { ErrorCategory } from '@product/contracts';

const INVITATION_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export interface CreateInvitationInput {
  projectId: string;
  invitedByUserId: string;
  invitedEmail: string;
  initialRole: string;
}

export async function createInvitation(input: CreateInvitationInput) {
  const plaintextToken = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(plaintextToken);
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

  const [row] = await db
    .insert(invitations)
    .values({
      projectId: input.projectId,
      invitedByUserId: input.invitedByUserId,
      invitedEmail: input.invitedEmail,
      tokenHash,
      initialRole: input.initialRole,
      expiresAt,
    })
    .returning();
  if (!row) throw new Error('invitation insert failed');

  return { invitation: row, token: plaintextToken };
}

export async function findInvitationByToken(token: string) {
  const tokenHash = hashToken(token);
  const result = await db
    .select()
    .from(invitations)
    .where(and(eq(invitations.tokenHash, tokenHash), gt(invitations.expiresAt, new Date())))
    .limit(1);
  return result[0] ?? null;
}

export async function acceptInvitation(token: string, acceptingUserId: string) {
  const invitation = await findInvitationByToken(token);
  if (!invitation) {
    throw new HttpError(404, ErrorCategory.NOT_FOUND, 'INVITATION_INVALID', 'Invitation not found or expired');
  }
  if (invitation.acceptedAt) {
    throw new HttpError(409, ErrorCategory.CONFLICT, 'INVITATION_ALREADY_USED', 'Invitation already accepted');
  }

  return db.transaction(async (tx) => {
    await tx
      .update(invitations)
      .set({ acceptedAt: new Date(), acceptedByUserId: acceptingUserId })
      .where(eq(invitations.id, invitation.id));

    const [membership] = await tx
      .insert(memberships)
      .values({
        projectId: invitation.projectId,
        userId: acceptingUserId,
        currentRole: invitation.initialRole,
        state: 'pending_approval',
      })
      .returning();

    return membership;
  });
}

export async function revokeInvitation(invitationId: string, reason: string) {
  await db
    .update(invitations)
    .set({ revokedAt: new Date(), revokedReason: reason })
    .where(eq(invitations.invitationId, invitationId));
}
