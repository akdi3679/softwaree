import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { devices } from '../db/schema';

export async function registerDevice(input: {
  ownerUserId: string;
  publicKey: string;
  role: 'admin' | 'user';
  projectId?: string;
  displayName: string;
}) {
  const [device] = await db.insert(devices).values({
    ownerUserId: input.ownerUserId,
    publicKey: input.publicKey,
    role: input.role,
    projectId: input.projectId,
    displayName: input.displayName,
    state: 'pending',
  }).returning();
  return device;
}

export async function replaceDevice(deviceId: string, newPublicKey: string) {
  const [device] = await db.update(devices).set({ publicKey: newPublicKey }).where(eq(devices.deviceId, deviceId)).returning();
  return device;
}
