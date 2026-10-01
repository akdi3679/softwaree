# TASK ID: SECURITY-003.2
# TITLE: Add session token rotation on privilege change
# STATUS: pending
# DEPENDENCIES: SECURITY-003.1
# ALLOWED FILES: platform-cloud/src/auth/session-rotation.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
When a user's role changes, all their sessions are rotated. Old tokens are invalidated.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/src/auth/session-rotation.ts`:

```typescript
import { db } from '../db';
import { sessions } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';

/// Rotate all sessions for a user. Called when role/permissions change.
export async function rotateUserSessions(userId: string, exceptSessionId?: string) {
  const where: any[] = [eq(sessions.userId, userId), isNull(sessions.revokedAt)];
  const rows = await db.select().from(sessions).where(where);
  for (const row of rows) {
    if (exceptSessionId && row.id === exceptSessionId) continue;
    await db.update(sessions)
      .set({ revokedAt: new Date().toISOString(), revokeReason: 'role_changed' })
      .where(eq(sessions.id, row.id));
  }
}

/// Check if a session is still valid (not revoked, not expired).
export async function isSessionValid(sessionId: string): Promise<boolean> {
  const row = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  if (row.length === 0) return false;
  if (row[0].revokedAt !== null) return false;
  if (new Date(row[0].expiresAt) < new Date()) return false;
  return true;
}
```

## TESTS

```bash
cd platform-cloud
test -f src/auth/session-rotation.ts || { echo "FAIL"; exit 1; }
grep -q "rotateUserSessions" src/auth/session-rotation.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
