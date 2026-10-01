# TASK ID: CONTRACT-090.1
# TITLE: Add contract: typed event ids
# STATUS: pending
# DEPENDENCIES: ADMIN-077.2
# ALLOWED FILES: product/contracts/src/types/event_type.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Prevent typos: `event_type` must be one of the known ones.

## REQUIRED IMPLEMENTATION

Create `product/contracts/src/types/event_type.ts`:

```typescript
export const CORE_EVENT_TYPES = [
  // Account
  'account.created', 'account.updated', 'account.deleted', 'account.suspended', 'account.restored',
  // Devices
  'device.added', 'device.activated', 'device.revoked', 'device.replaced',
  // Projects
  'project.created', 'project.updated', 'project.archived', 'project.restored', 'project.suspended',
  // Invitations
  'invitation.created', 'invitation.accepted', 'invitation.revoked', 'invitation.expired',
  // Memberships
  'membership.added', 'membership.updated', 'membership.removed',
  // Users
  'user.added', 'user.updated', 'user.removed',
  // Modules
  'module.installed', 'module.uninstalled', 'module.updated', 'module.enabled', 'module.disabled',
  // Backups
  'backup.started', 'backup.completed', 'backup.failed', 'backup.restored',
  // Settings
  'settings.updated', 'feature_flag.updated',
] as const;

export type CoreEventType = typeof CORE_EVENT_TYPES[number];

// Modules can extend with their own event types
export type EventType = CoreEventType | (string & {});

export function isCoreEventType(t: string): t is CoreEventType {
  return (CORE_EVENT_TYPES as readonly string[]).includes(t);
}
```

## TESTS

```bash
cd product
test -f contracts/src/types/event_type.ts || { echo "FAIL"; exit 1; }
grep -q "CORE_EVENT_TYPES" contracts/src/types/event_type.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
