# TASK ID: CONTRACT-009.2
# TITLE: Define EventType enum
# STATUS: pending
# DEPENDENCIES: CONTRACT-009.1
# ALLOWED FILES: product/packages/contracts/src/events/event-type.ts, product/packages/contracts/src/events/index.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Define `EventType` — the set of known event types. Matches the command types in `<aggregate>.<past_tense_verb>` form.

## REQUIRED IMPLEMENTATION

Create the file `product/packages/contracts/src/events/event-type.ts`:

```typescript
import { z } from 'zod';

/**
 * Built-in event types. Past-tense verb form.
 * Mirrors CommandType: `<aggregate>.<past_tense>`.
 */
export const EventType = {
  // Account / Cloud
  ACCOUNT_CREATED: 'account.created',
  ACCOUNT_LOGGED_IN: 'account.logged_in',
  DEVICE_REGISTERED: 'device.registered',
  DEVICE_REPLACED: 'device.replaced',
  DEVICE_REVOKED: 'device.revoked',

  // Project
  PROJECT_CREATED: 'project.created',
  PROJECT_INVITATION_SENT: 'project.invitation_sent',
  PROJECT_INVITATION_ACCEPTED: 'project.invitation_accepted',
  PROJECT_MEMBERSHIP_APPROVED: 'project.membership_approved',
  PROJECT_ROLE_ASSIGNED: 'project.role_assigned',
  PROJECT_ROLE_REVOKED: 'project.role_revoked',
  PROJECT_SUSPENDED: 'project.suspended',
  PROJECT_RESUMED: 'project.resumed',
  PROJECT_ARCHIVED: 'project.archived',

  // Module
  MODULE_INSTALLED: 'module.installed',
  MODULE_UNINSTALLED: 'module.uninstalled',
  MODULE_ENABLED: 'module.enabled',
  MODULE_DISABLED: 'module.disabled',

  // Backup
  BACKUP_TRIGGERED: 'backup.triggered',
  BACKUP_COMPLETED: 'backup.completed',
  BACKUP_FAILED: 'backup.failed',
  BACKUP_RESTORED: 'backup.restored',
} as const;

export type EventType = (typeof EventType)[keyof typeof EventType];

export const EventTypeSchema = z
  .string()
  .regex(
    /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/,
    'EventType must be in format "noun.verb" or "module.noun.verb"',
  );
```

Update `product/packages/contracts/src/events/index.ts` to add the export.

## ACCEPTANCE CRITERIA
- [ ] File exists
- [ ] At least 20 event types defined
- [ ] Past-tense verb form

## TESTS

```bash
cd product
test -f packages/contracts/src/events/event-type.ts || { echo "FAIL"; exit 1; }
COUNT=$(grep -c "^\s*[A-Z_]\+:" packages/contracts/src/events/event-type.ts)
test "$COUNT" -ge 20 || { echo "FAIL: only $COUNT"; exit 1; }
pnpm --filter @product/contracts typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
