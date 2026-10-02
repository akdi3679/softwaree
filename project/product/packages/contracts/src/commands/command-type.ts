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

export const CommandTypeSchema = z
  .string()
  .regex(
    /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/,
    'CommandType must be in format "noun.verb" or "module.noun.verb"',
  );
