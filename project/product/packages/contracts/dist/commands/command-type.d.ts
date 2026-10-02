import { z } from 'zod';
/**
 * Built-in command types.
 *
 * Format: `<aggregate>.<action>`. Module commands use the same format
 * with a module prefix, e.g., `medical.patient.create`,
 * `lab.sample.submit`.
 */
export declare const CommandType: {
    readonly ACCOUNT_CREATE: "account.create";
    readonly ACCOUNT_LOGIN: "account.login";
    readonly DEVICE_REGISTER: "device.register";
    readonly DEVICE_REPLACE: "device.replace";
    readonly PROJECT_CREATE: "project.create";
    readonly PROJECT_INVITE_USER: "project.invite_user";
    readonly PROJECT_ACCEPT_INVITATION: "project.accept_invitation";
    readonly PROJECT_APPROVE_MEMBERSHIP: "project.approve_membership";
    readonly PROJECT_ASSIGN_ROLE: "project.assign_role";
    readonly PROJECT_REVOKE_ROLE: "project.revoke_role";
    readonly PROJECT_SUSPEND: "project.suspend";
    readonly PROJECT_RESUME: "project.resume";
    readonly PROJECT_ARCHIVE: "project.archive";
    readonly MODULE_INSTALL: "module.install";
    readonly MODULE_UNINSTALL: "module.uninstall";
    readonly MODULE_ENABLE: "module.enable";
    readonly MODULE_DISABLE: "module.disable";
    readonly BACKUP_TRIGGER: "backup.trigger";
    readonly BACKUP_RESTORE: "backup.restore";
    readonly AUTH_LOGOUT: "auth.logout";
    readonly AUTH_REFRESH_SESSION: "auth.refresh_session";
};
export type CommandType = (typeof CommandType)[keyof typeof CommandType];
export declare const CommandTypeSchema: z.ZodString;
//# sourceMappingURL=command-type.d.ts.map