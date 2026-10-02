import { z } from 'zod';
import { ErrorContractSchema } from './contract';
/**
 * Network error: transport-level failure.
 *
 * Most common: connection dropped, timeout, DNS failure, our mesh
 * not reachable. Always category: TRANSIENT or UNAVAILABLE. Retryable.
 *
 * `code` values:
 *   NET_CONNECTION_REFUSED
 *   NET_TIMEOUT
 *   NET_DNS_FAILURE
 *   NET_TAILSCALE_DOWN
 *   NET_LAN_UNREACHABLE
 *   NET_PROTOCOL_ERROR
 */
export const NetworkErrorSchema = ErrorContractSchema.extend({
    category: z.union([z.literal('transient'), z.literal('unavailable')]),
    code: z.string().regex(/^NET_/, 'must start with NET_'),
    details: z
        .object({
        endpoint: z.string().optional(),
        retryAfterMs: z.number().int().optional(),
        attempt: z.number().int().optional(),
    })
        .optional(),
});
//# sourceMappingURL=network.js.map