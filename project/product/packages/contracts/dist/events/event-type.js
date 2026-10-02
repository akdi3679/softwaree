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
};
export const EventTypeSchema = z
    .string()
    .regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/, 'EventType must be in format "noun.verb" or "module.noun.verb"');
//# sourceMappingURL=event-type.js.map