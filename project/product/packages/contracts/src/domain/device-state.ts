import { z } from 'zod';

/**
 * Device lifecycle states.
 *
 *  PENDING ? ACTIVE ? (SUSPENDED | REVOKED | REPLACED)
 *
 * - PENDING: device registered, awaiting first auth challenge
 * - ACTIVE: device is currently authorized
 * - SUSPENDED: temporarily disabled (anomaly detected, support action)
 * - REVOKED: terminal, no recovery without re-registration
 * - REPLACED: replaced by a new device (old device's history preserved for audit)
 */
export const DeviceState = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  REVOKED: 'revoked',
  REPLACED: 'replaced',
} as const;

export type DeviceState = (typeof DeviceState)[keyof typeof DeviceState];

export const DeviceStateSchema = z.nativeEnum(DeviceState);
