import { z } from 'zod';
/**
 * Project lifecycle states.
 *
 *  CREATING ? ACTIVE ? SUSPENDED ? ACTIVE ? ARCHIVED
 *
 * - CREATING: project is being initialized (Admin device setting up, modules installing)
 * - ACTIVE: normal operating state
 * - SUSPENDED: temporarily disabled (billing issue, security review). Reads still possible for cache, writes blocked.
 * - ARCHIVED: terminal state, read-only. Project can be restored within 30 days, then hard-deleted.
 */
export declare const ProjectState: {
    readonly CREATING: "creating";
    readonly ACTIVE: "active";
    readonly SUSPENDED: "suspended";
    readonly ARCHIVED: "archived";
};
export type ProjectState = (typeof ProjectState)[keyof typeof ProjectState];
export declare const ProjectStateSchema: z.ZodNativeEnum<{
    readonly CREATING: "creating";
    readonly ACTIVE: "active";
    readonly SUSPENDED: "suspended";
    readonly ARCHIVED: "archived";
}>;
//# sourceMappingURL=project-state.d.ts.map