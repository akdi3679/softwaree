import { z } from 'zod';
/**
 * A heartbeat sent to the discovery service every 60 seconds.
 * Contains only IP metadata, never message contents.
 */
export declare const DiscoveryHeartbeatSchema: z.ZodObject<{
    deviceId: z.ZodBranded<z.ZodString, "DeviceId">;
    virtualIp: z.ZodString;
    currentPublicIp: z.ZodOptional<z.ZodString>;
    currentPublicPort: z.ZodOptional<z.ZodNumber>;
    currentIpv6: z.ZodOptional<z.ZodString>;
    state: z.ZodEnum<["lan", "internet", "offline"]>;
    reachableMethods: z.ZodArray<z.ZodEnum<["direct_v4", "direct_v6"]>, "many">;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    deviceId: string & z.BRAND<"DeviceId">;
    timestamp: string;
    state: "lan" | "internet" | "offline";
    virtualIp: string;
    reachableMethods: ("direct_v4" | "direct_v6")[];
    currentPublicIp?: string | undefined;
    currentPublicPort?: number | undefined;
    currentIpv6?: string | undefined;
}, {
    deviceId: string;
    timestamp: string;
    state: "lan" | "internet" | "offline";
    virtualIp: string;
    reachableMethods: ("direct_v4" | "direct_v6")[];
    currentPublicIp?: string | undefined;
    currentPublicPort?: number | undefined;
    currentIpv6?: string | undefined;
}>;
export type DiscoveryHeartbeat = z.infer<typeof DiscoveryHeartbeatSchema>;
//# sourceMappingURL=heartbeat.d.ts.map