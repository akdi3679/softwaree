import { z } from 'zod';
/**
 * Transport methods used to reach a peer.
 * Priority order: LAN (mDNS), direct internet, discovery, customer relay.
 */
export declare const TransportMethod: {
    readonly LAN: "lan";
    readonly DIRECT_V4: "direct_v4";
    readonly DIRECT_V6: "direct_v6";
    readonly DISCOVERY: "discovery";
    readonly CUSTOMER_RELAY: "customer_relay";
};
export type TransportMethod = (typeof TransportMethod)[keyof typeof TransportMethod];
export declare const TransportMethodSchema: z.ZodNativeEnum<{
    readonly LAN: "lan";
    readonly DIRECT_V4: "direct_v4";
    readonly DIRECT_V6: "direct_v6";
    readonly DISCOVERY: "discovery";
    readonly CUSTOMER_RELAY: "customer_relay";
}>;
/**
 * Reachability state of a device as reported in heartbeats.
 */
export declare const DeviceReachabilitySchema: z.ZodObject<{
    method: z.ZodNativeEnum<{
        readonly LAN: "lan";
        readonly DIRECT_V4: "direct_v4";
        readonly DIRECT_V6: "direct_v6";
        readonly DISCOVERY: "discovery";
        readonly CUSTOMER_RELAY: "customer_relay";
    }>;
    publicIp: z.ZodOptional<z.ZodString>;
    publicPort: z.ZodOptional<z.ZodNumber>;
    lastSeenAt: z.ZodOptional<z.ZodString>;
    state: z.ZodEnum<["lan", "internet", "offline"]>;
}, "strip", z.ZodTypeAny, {
    state: "lan" | "internet" | "offline";
    method: "lan" | "direct_v4" | "direct_v6" | "discovery" | "customer_relay";
    lastSeenAt?: string | undefined;
    publicIp?: string | undefined;
    publicPort?: number | undefined;
}, {
    state: "lan" | "internet" | "offline";
    method: "lan" | "direct_v4" | "direct_v6" | "discovery" | "customer_relay";
    lastSeenAt?: string | undefined;
    publicIp?: string | undefined;
    publicPort?: number | undefined;
}>;
export type DeviceReachability = z.infer<typeof DeviceReachabilitySchema>;
//# sourceMappingURL=transport.d.ts.map