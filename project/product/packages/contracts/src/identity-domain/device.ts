import { z } from 'zod';
import { DeviceIdSchema } from '../identity/device-id';
import { UserIdSchema } from '../identity/user-id';
import { ProjectIdSchema } from '../identity/project-id';
import { DeviceStateSchema } from '../domain/device-state';
import { TimestampSchema } from '../time/timestamp';

/**
 * A registered device in the Cloud.
 *
 * Each device has a keypair; the public key is stored here.
 * The private key never leaves the device.
 *
 * `meshNodeId` is our mesh node ID for this device.
 */
export const DeviceRole = {
  ADMIN: 'admin',
  USER: 'user',
  CLOUD_SERVICE: 'cloud_service',
  OPS: 'ops',
} as const;

export type DeviceRole = (typeof DeviceRole)[keyof typeof DeviceRole];

export const DeviceSchema = z.object({
  deviceId: DeviceIdSchema,
  ownerUserId: UserIdSchema,
  projectId: ProjectIdSchema.optional(),
  role: z.nativeEnum(DeviceRole),
  publicKey: z.string(),
  state: DeviceStateSchema,
  tailscaleNodeId: z.string().optional(),
  displayName: z.string().min(1).max(256),
  createdAt: TimestampSchema,
  lastSeenAt: TimestampSchema.optional(),
  replacedByDeviceId: DeviceIdSchema.optional(),
  revokedAt: TimestampSchema.optional(),
  revokedReason: z.string().optional(),
});

export type Device = z.infer<typeof DeviceSchema>;
