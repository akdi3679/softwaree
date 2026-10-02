import { z } from 'zod';
import { DeviceIdSchema } from '../identity/device-id';

/**
 * A heartbeat sent to the discovery service every 60 seconds.
 * Contains only IP metadata, never message contents.
 */
export const DiscoveryHeartbeatSchema = z.object({
  deviceId: DeviceIdSchema,
  virtualIp: z.string().ip({ version: 'v4' }), // stable internal IP, e.g., 10.50.0.1
  currentPublicIp: z.string().ip().optional(),
  currentPublicPort: z.number().int().min(1).max(65535).optional(),
  currentIpv6: z.string().ip({ version: 'v6' }).optional(),
  state: z.enum(['lan', 'internet', 'offline']),
  reachableMethods: z.array(z.enum(['direct_v4', 'direct_v6'])),
  timestamp: z.string().datetime(),
});

export type DiscoveryHeartbeat = z.infer<typeof DiscoveryHeartbeatSchema>;
