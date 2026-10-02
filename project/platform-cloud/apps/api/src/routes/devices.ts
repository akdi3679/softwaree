import { Hono } from 'hono';
import { z } from 'zod';
import { registerDevice, replaceDevice } from '../services/devices';

const router = new Hono();

const RegisterSchema = z.object({
  ownerUserId: z.string().uuid(),
  publicKey: z.string().min(1),
  role: z.enum(['admin', 'user']),
  projectId: z.string().uuid().optional(),
  displayName: z.string().min(1).max(256),
});

router.post('/v1/devices/register', async (c) => {
  const body = RegisterSchema.parse(await c.req.json());
  const device = await registerDevice(body);
  return c.json({ device }, 201);
});

const ReplaceSchema = z.object({
  newPublicKey: z.string().min(1),
});

router.post('/v1/devices/:deviceId/replace', async (c) => {
  const deviceId = c.req.param('deviceId');
  const body = ReplaceSchema.parse(await c.req.json());
  const device = await replaceDevice(deviceId, body.newPublicKey);
  return c.json({ device });
});

export default router;
