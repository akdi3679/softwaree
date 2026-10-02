import { z } from 'zod';
/**
 * Transport methods used to reach a peer.
 * Priority order: LAN (mDNS), direct internet, discovery, customer relay.
 */
export const TransportMethod = {
    LAN: 'lan',
    DIRECT_V4: 'direct_v4',
    DIRECT_V6: 'direct_v6',
    DISCOVERY: 'discovery',
    CUSTOMER_RELAY: 'customer_relay',
};
export const TransportMethodSchema = z.nativeEnum(TransportMethod);
/**
 * Reachability state of a device as reported in heartbeats.
 */
export const DeviceReachabilitySchema = z.object({
    method: TransportMethodSchema,
    publicIp: z.string().optional(),
    publicPort: z.number().int().min(1).max(65535).optional(),
    lastSeenAt: z.string().datetime().optional(),
    state: z.enum(['lan', 'internet', 'offline']),
});
//# sourceMappingURL=transport.js.map