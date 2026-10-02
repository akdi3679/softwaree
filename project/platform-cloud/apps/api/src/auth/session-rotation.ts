import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db/client";
import { sessions } from "../db/schema/sessions";

// Revoke all live sessions for a user. Call when their role/permissions change.
export async function rotateUserSessions(userId: string, exceptSessionId?: string) {
  const rows = await db
    .select({ id: sessions.id, sessionId: sessions.sessionId })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));

  let revoked = 0;
  for (const row of rows) {
    if (exceptSessionId && row.sessionId === exceptSessionId) continue;
    await db
      .update(sessions)
      .set({
        isRevoked: "true",
        revokedAt: new Date(),
        revokedReason: "role_changed",
      })
      .where(eq(sessions.id, row.id));
    revoked++;
  }
  return { revoked };
}

// Check if a session is currently valid (not revoked, not expired).
export async function isSessionValid(sessionId: string): Promise<boolean> {
  const rows = await db
    .select({
      isRevoked: sessions.isRevoked,
      revokedAt: sessions.revokedAt,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .where(eq(sessions.sessionId, sessionId))
    .limit(1);

  const s = rows[0];
  if (!s) return false;
  if (s.isRevoked === "true" || s.revokedAt !== null) return false;
  if (s.expiresAt.getTime() < Date.now()) return false;
  return true;
}
