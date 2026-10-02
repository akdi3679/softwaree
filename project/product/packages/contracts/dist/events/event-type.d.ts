import { z } from 'zod';
/**
 * Built-in event types. Past-tense verb form.
 * Mirrors CommandType: `<aggregate>.<past_tense>`.
 */
export declare const EventType: {
    readonly ACCOUNT_CREATED: "account.created";
    readonly ACCOUNT_LOGGED_IN: "account.logged_in";
    readonly DEVICE_REGISTERED: "device.registered";
    readonly DEVICE_REPLACED: "device.replaced";
    readonly DEVICE_REVOKED: "device.revoked";
    readonly PROJECT_CREATED: "project.created";
    readonly PROJECT_INVITATION_SENT: "project.invitation_sent";
    readonly PROJECT_INVITATION_ACCEPTED: "project.invitation_accepted";
    readonly PROJECT_MEMBERSHIP_APPROVED: "project.membership_approved";
    readonly PROJECT_ROLE_ASSIGNED: "project.role_assigned";
    readonly PROJECT_ROLE_REVOKED: "project.role_revoked";
    readonly PROJECT_SUSPENDED: "project.suspended";
    readonly PROJECT_RESUMED: "project.resumed";
    readonly PROJECT_ARCHIVED: "project.archived";
    readonly MODULE_INSTALLED: "module.installed";
    readonly MODULE_UNINSTALLED: "module.uninstalled";
    readonly MODULE_ENABLED: "module.enabled";
    readonly MODULE_DISABLED: "module.disabled";
    readonly BACKUP_TRIGGERED: "backup.triggered";
    readonly BACKUP_COMPLETED: "backup.completed";
    readonly BACKUP_FAILED: "backup.failed";
    readonly BACKUP_RESTORED: "backup.restored";
};
export type EventType = (typeof EventType)[keyof typeof EventType];
export declare const EventTypeSchema: z.ZodString;
//# sourceMappingURL=event-type.d.ts.map