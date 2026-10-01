# TASK ID: CONTRACT-013.3
# TITLE: Define Invitation entity
# STATUS: pending
# DEPENDENCIES: CONTRACT-013.2
# ALLOWED FILES: product/packages/contracts/src/identity-domain/invitation.ts, product/packages/contracts/src/identity-domain/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define the `Invitation` entity — Cloud's record of a pending invitation.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/identity-domain/invitation.ts`:

```typescript
import { z } from 'zod';
import { ProjectIdSchema } from '../identity/project-id';
import { UserIdSchema } from '../identity/user-id';

/**
 * A pending invitation to join a project.
 *
 * The actual auth token is NOT stored — only its hash.
 * When the user accepts with the token, the system re-hashes and compares.
 */
export const InvitationSchema = z.object({
  invitationId: z.string().uuid(),
  projectId: ProjectIdSchema,
  invitedByUserId: UserIdSchema,
  invitedEmail: z.string().email(),
  tokenHash: z.string().min(64).max(128), // SHA-256 of the plaintext token
  initialRole: z.string().min(1).max(64), // role name to assign on approval
  expiresAt: z.string().datetime(),
  acceptedAt: z.string().datetime().optional(),
  acceptedByUserId: UserIdSchema.optional(),
  revokedAt: z.string().datetime().optional(),
  revokedReason: z.string().optional(),
  createdAt: z.string().datetime(),
});

export type Invitation = z.infer<typeof InvitationSchema>;
```

Update `product/packages/contracts/src/identity-domain/index.ts` to add exports.

## TESTS

```bash
cd product
test -f packages/contracts/src/identity-domain/invitation.ts || { echo "FAIL"; exit 1; }
grep -q "tokenHash" packages/contracts/src/identity-domain/invitation.ts || { echo "FAIL: no tokenHash"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
