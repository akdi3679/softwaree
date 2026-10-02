import { z } from 'zod';
/**
 * A registered device in the Cloud.
 *
 * Each device has a keypair; the public key is stored here.
 * The private key never leaves the device.
 *
 * `meshNodeId` is our mesh node ID for this device.
 */
export declare const DeviceRole: {
    readonly ADMIN: "admin";
    readonly USER: "user";
    readonly CLOUD_SERVICE: "cloud_service";
    readonly OPS: "ops";
};
export type DeviceRole = (typeof DeviceRole)[keyof typeof DeviceRole];
export declare const DeviceSchema: z.ZodObject<{
    deviceId: z.ZodBranded<z.ZodString, "DeviceId">;
    ownerUserId: z.ZodBranded<z.ZodString, "UserId">;
    projectId: z.ZodOptional<z.ZodBranded<z.ZodString, "ProjectId">>;
    role: z.ZodNativeEnum<{
        readonly ADMIN: "admin";
        readonly USER: "user";
        readonly CLOUD_SERVICE: "cloud_service";
        readonly OPS: "ops";
    }>;
    publicKey: z.ZodString;
    state: z.ZodNativeEnum<{
        readonly PENDING: "pending";
        readonly ACTIVE: "active";
        readonly SUSPENDED: "suspended";
        readonly REVOKED: "revoked";
        readonly REPLACED: "replaced";
    }>;
    tailscaleNodeId: z.ZodOptional<z.ZodString>;
    displayName: z.ZodString;
    createdAt: z.ZodBranded<z.ZodDate, "Timestamp">;
    lastSeenAt: z.ZodOptional<z.ZodBranded<z.ZodDate, "Timestamp">>;
    replacedByDeviceId: z.ZodOptional<z.ZodBranded<z.ZodString, "DeviceId">>;
    revokedAt: z.ZodOptional<z.ZodBranded<z.ZodDate, "Timestamp">>;
    revokedReason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    deviceId: string & z.BRAND<"DeviceId">;
    createdAt: Date & z.BRAND<"Timestamp">;
    displayName: string;
    ownerUserId: string & z.BRAND<"UserId">;
    role: "admin" | "user" | "cloud_service" | "ops";
    publicKey: string;
    state: "pending" | "active" | "suspended" | "revoked" | "replaced";
    projectId?: (string & z.BRAND<"ProjectId">) | undefined;
    tailscaleNodeId?: string | undefined;
    lastSeenAt?: (Date & z.BRAND<"Timestamp">) | undefined;
    replacedByDeviceId?: (string & z.BRAND<"DeviceId">) | undefined;
    revokedAt?: (Date & z.BRAND<"Timestamp">) | undefined;
    revokedReason?: string | undefined;
}, {
    deviceId: string;
    createdAt: Date;
    displayName: string;
    ownerUserId: string;
    role: "admin" | "user" | "cloud_service" | "ops";
    publicKey: string;
    state: "pending" | "active" | "suspended" | "revoked" | "replaced";
    projectId?: string | undefined;
    tailscaleNodeId?: string | undefined;
    lastSeenAt?: Date | undefined;
    replacedByDeviceId?: string | undefined;
    revokedAt?: Date | undefined;
    revokedReason?: string | undefined;
}>;
export type Device = z.infer<typeof DeviceSchema>;
//# sourceMappingURL=device.d.ts.map