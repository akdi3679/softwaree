/**
 * Sync types and protocol definitions.
 */
export { SyncPositionSchema } from './position';
export { SyncRequestSchema } from './request';
export { SyncResponseSchema } from './response';
export { SnapshotPayloadSchema } from './snapshot';
export { SyncConflictSchema } from './conflict';
export { SyncAckSchema } from './ack';
export { SyncHelloSchema } from './hello';
// New protocol types
export { FrameType } from './frame';
export { FrameTypeSchema, FrameHeaderSchema } from './frame';
export { TransportMethod } from './transport';
export { TransportMethodSchema, DeviceReachabilitySchema } from './transport';
export { DiscoveryHeartbeatSchema } from './heartbeat';
export { CommandRequestSchema, CommandAckGottenSchema, CommandApplyRequestSchema, CommandAppliedSchema, CommandApplyConfirmSchema, CommandResponseSchema, } from './command-handshake';
export { EventBatchSchema } from './event-batch';
export { SYNC_PROTOCOL_VERSION, SYNC_PORT, HEARTBEAT_INTERVAL_SECONDS, DISCOVERY_MAX_AGE_MINUTES, DISCOVERY_FORGET_AFTER_DAYS, MAX_CONCURRENT_USER_CONNECTIONS, MAX_COMMANDS_PER_SECOND, ADMIN_VIRTUAL_IP, USER_VIRTUAL_IP_PREFIX, } from './protocol-constants';
//# sourceMappingURL=index.js.map