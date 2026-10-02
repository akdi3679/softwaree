import { z } from 'zod';
/**
 * Device lifecycle states.
 *
 *  PENDING ? ACTIVE ? (SUSPENDED | REVOKED | REPLACED)
 *
 * - PENDING: device registered, awaiting first auth challenge
 * - ACTIVE: device is currently authorized
 * - SUSPENDED: temporarily disabled (anomaly detected, support action)
 * - REVOKED: terminal, no recovery without re-registration
 * - REPLACED: replaced by a new device (old device's history preserved for audit)
 */
export declare const DeviceState: {
    readonly PENDING: "pending";
    readonly ACTIVE: "active";
    readonly SUSPENDED: "suspended";
    readonly REVOKED: "revoked";
    readonly REPLACED: "replaced";
};
export type DeviceState = (typeof DeviceState)[keyof typeof DeviceState];
export declare const DeviceStateSchema: z.ZodNativeEnum<{
    readonly PENDING: "pending";
    readonly ACTIVE: "active";
    readonly SUSPENDED: "suspended";
    readonly REVOKED: "revoked";
    readonly REPLACED: "replaced";
}>;
//# sourceMappingURL=device-state.d.ts.map