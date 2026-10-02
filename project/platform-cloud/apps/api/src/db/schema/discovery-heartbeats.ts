import { pgTable, varchar, integer, jsonb, timestamp, index } from 'drizzle-orm/pg-core';

export const discoveryHeartbeats = pgTable(
  'discovery_heartbeats',
  {
    deviceId: varchar('device_id', { length: 64 }).primaryKey(),
    virtualIp: varchar('virtual_ip', { length: 32 }).notNull(),
    currentPublicIp: varchar('current_public_ip', { length: 64 }),
    currentPublicPort: integer('current_public_port'),
    currentIpv6: varchar('current_ipv6', { length: 64 }),
    state: varchar('state', { length: 16 }).notNull().default('unknown'),
    reachableMethods: jsonb('reachable_methods').$type<string[]>().notNull().default([]),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    virtualIpIdx: index('discovery_heartbeats_virtual_ip_idx').on(t.virtualIp),
    lastSeenIdx: index('discovery_heartbeats_last_seen_idx').on(t.lastSeenAt),
  }),
);

export type DiscoveryHeartbeatRow = typeof discoveryHeartbeats.$inferSelect;
export type DiscoveryHeartbeatInsert = typeof discoveryHeartbeats.$inferInsert;