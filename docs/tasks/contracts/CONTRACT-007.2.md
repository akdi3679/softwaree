# TASK ID: CONTRACT-007.2
# TITLE: Define CommandType enum
# STATUS: pending
# DEPENDENCIES: CONTRACT-007.1
# ALLOWED FILES: product/packages/contracts/src/commands/command-type.ts, product/packages/contracts/src/commands/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Define `CommandType` constants for all known commands. Using a const object pattern instead of Zod enum so we can extend with module-defined commands later.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/commands/command-type.ts`:

```typescript
import { z } from 'zod';

/**
 * Built-in command types.
 *
 * Format: `<aggregate>.<action>`. Module commands use the same format
 * with a module prefix, e.g., `medical.patient.create`,
 * `lab.sample.submit`.
 */
export const CommandType = {
  // Account / Cloud
  ACCOUNT_CREATE: 'account.create',
  ACCOUNT_LOGIN: 'account.login',
  DEVICE_REGISTER: 'device.register',
  DEVICE_REPLACE: 'device.replace',

  // Project
  PROJECT_CREATE: 'project.create',
  PROJECT_INVITE_USER: 'project.invite_user',
  PROJECT_ACCEPT_INVITATION: 'project.accept_invitation',
  PROJECT_APPROVE_MEMBERSHIP: 'project.approve_membership',
  PROJECT_ASSIGN_ROLE: 'project.assign_role',
  PROJECT_REVOKE_ROLE: 'project.revoke_role',
  PROJECT_SUSPEND: 'project.suspend',
  PROJECT_RESUME: 'project.resume',
  PROJECT_ARCHIVE: 'project.archive',

  // Module management
  MODULE_INSTALL: 'module.install',
  MODULE_UNINSTALL: 'module.uninstall',
  MODULE_ENABLE: 'module.enable',
  MODULE_DISABLE: 'module.disable',

  // Backup
  BACKUP_TRIGGER: 'backup.trigger',
  BACKUP_RESTORE: 'backup.restore',

  // Auth
  AUTH_LOGOUT: 'auth.logout',
  AUTH_REFRESH_SESSION: 'auth.refresh_session',
} as const;

export type CommandType = (typeof CommandType)[keyof typeof CommandType];

/**
 * Pattern: must be `<noun>.<verb>` (lowercase, dot-separated).
 * Module commands must be `<module>.<noun>.<verb>`.
 */
export const CommandTypeSchema = z
  .string()
  .regex(
    /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/,
    'CommandType must be in format "noun.verb" or "module.noun.verb"',
  );
```

Create the file `product/packages/contracts/src/commands/index.ts`:

```typescript
/**
 * Command envelope and payload types.
 */

export type { CommandEnvelope } from './envelope';
export { CommandEnvelopeSchema } from './envelope';
export { CommandType } from './command-type';
export type { CommandType as CommandTypeValue } from './command-type';
export { CommandTypeSchema } from './command-type';
```

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] At least 20 built-in command types
- [ ] `CommandType` is const object (not enum)
- [ ] Zod schema validates format `noun.verb` or `module.noun.verb`

## TESTS

```bash
cd product
test -f packages/contracts/src/commands/command-type.ts || { echo "FAIL"; exit 1; }
test -f packages/contracts/src/commands/index.ts || { echo "FAIL: no index"; exit 1; }

# Count command types
COUNT=$(grep -c "^\s*[A-Z_]\+:" packages/contracts/src/commands/command-type.ts)
test "$COUNT" -ge 20 || { echo "FAIL: only $COUNT command types"; exit 1; }

pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
