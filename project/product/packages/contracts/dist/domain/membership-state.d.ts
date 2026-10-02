import { z } from 'zod';
/**
 * Membership lifecycle states.
 *
 *  PENDING_INVITATION ? PENDING_APPROVAL ? ACTIVE ? (SUSPENDED | REMOVED)
 *
 * - PENDING_INVITATION: invitation sent, user has not yet accepted
 * - PENDING_APPROVAL: user accepted, admin has not yet approved
 * - ACTIVE: member can access the project
 * - SUSPENDED: temporarily blocked (e.g., plan downgraded)
 * - REMOVED: terminal, removed from project
 */
export declare const MembershipState: {
    readonly PENDING_INVITATION: "pending_invitation";
    readonly PENDING_APPROVAL: "pending_approval";
    readonly ACTIVE: "active";
    readonly SUSPENDED: "suspended";
    readonly REMOVED: "removed";
};
export type MembershipState = (typeof MembershipState)[keyof typeof MembershipState];
export declare const MembershipStateSchema: z.ZodNativeEnum<{
    readonly PENDING_INVITATION: "pending_invitation";
    readonly PENDING_APPROVAL: "pending_approval";
    readonly ACTIVE: "active";
    readonly SUSPENDED: "suspended";
    readonly REMOVED: "removed";
}>;
//# sourceMappingURL=membership-state.d.ts.map