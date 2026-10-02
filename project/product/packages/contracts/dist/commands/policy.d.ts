import { z } from 'zod';
/**
 * Where a command can be processed.
 *
 * In v1, all commands with non-LOCAL_ONLY policy require Admin to be online.
 * In v2, OFFLINE_QUEUEABLE commands may be queued when Admin is offline.
 *
 * - LOCAL_ONLY: command is processed entirely on the User app. No Admin needed.
 *   Example: a "draft note" command.
 * - OFFLINE_QUEUEABLE: command may be queued locally and sent when Admin returns.
 *   v2 feature. Not used in v1.
 * - ADMIN_REQUIRED: command must be processed by the Admin. If Admin offline, command fails.
 *   Most business commands fall here.
 * - CLOUD_REQUIRED: command must be processed by the Cloud. If Cloud offline, command fails.
 *   Account, billing, plan changes.
 */
export declare const CommandPolicy: {
    readonly LOCAL_ONLY: "local_only";
    readonly OFFLINE_QUEUEABLE: "offline_queueable";
    readonly ADMIN_REQUIRED: "admin_required";
    readonly CLOUD_REQUIRED: "cloud_required";
};
export type CommandPolicy = (typeof CommandPolicy)[keyof typeof CommandPolicy];
export declare const CommandPolicySchema: z.ZodNativeEnum<{
    readonly LOCAL_ONLY: "local_only";
    readonly OFFLINE_QUEUEABLE: "offline_queueable";
    readonly ADMIN_REQUIRED: "admin_required";
    readonly CLOUD_REQUIRED: "cloud_required";
}>;
//# sourceMappingURL=policy.d.ts.map