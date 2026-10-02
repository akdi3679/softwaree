/**
 * Sync protocol constants.
 */
export const SYNC_PROTOCOL_VERSION = 1 as const;
export const SYNC_PORT = 9090 as const;
export const HEARTBEAT_INTERVAL_SECONDS = 60 as const;
export const DISCOVERY_MAX_AGE_MINUTES = 30 as const;
export const DISCOVERY_FORGET_AFTER_DAYS = 7 as const;
export const MAX_CONCURRENT_USER_CONNECTIONS = 4 as const;
export const MAX_COMMANDS_PER_SECOND = 100 as const;

// Stable virtual IPs within a project (private range 10.50.0.0/16)
export const ADMIN_VIRTUAL_IP = '10.50.0.1' as const;
export const USER_VIRTUAL_IP_PREFIX = '10.50.0.' as const;
