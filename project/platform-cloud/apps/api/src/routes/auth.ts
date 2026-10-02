import { Hono } from 'hono';
import { z } from 'zod';
import { signup, login } from '../services/auth';
import { generateSetup, urlFor } from '../services/totp';
import { db } from '../db/client';
import { accounts } from '../db/schema/accounts';
import { eq } from 'drizzle-orm';

const router = new Hono();

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  displayName: z.string().min(1).max(256),
});

router.post('/v1/accounts', async (c) => {
  const body = SignupSchema.parse(await c.req.json());
  const result = await signup(body.email, body.password, body.displayName);
  return c.json({ accountId: result.accountId, userId: result.userId }, 201);
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  deviceId: z.string().uuid().optional(),
  totpCode: z.string().min(6).max(8).optional(),
});

router.post('/v1/accounts/sessions', async (c) => {
  const body = LoginSchema.parse(await c.req.json());
  const ip =
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    '0.0.0.0';
  const result = await login(body.email, body.password, ip, body.deviceId, body.totpCode);
  return c.json(
    {
      sessionId: result.sessionId,
      userId: result.userId,
      accountId: result.accountId,
      expiresAt: result.expiresAt.toISOString(),
    },
    201,
  );
});

// ---------------------------------------------------------------------------
// TOTP setup endpoints. These are authenticated by `accountId` in the body
// for now (the session-based auth middleware has not been wired yet).
// Once it lands, replace `accountId` with `c.get("accountId")`.
// ---------------------------------------------------------------------------

const TotpEnableSchema = z.object({
  accountId: z.string().uuid(),
  accountName: z.string().min(1).max(256),
});

router.post('/v1/accounts/totp/enable', async (c) => {
  const body = TotpEnableSchema.parse(await c.req.json());
  const rows = await db.select().from(accounts).where(eq(accounts.id, body.accountId)).limit(1);
  if (!rows[0]) return c.json({ error: 'not_found' }, 404);

  const setup = generateSetup(body.accountName);
  // Persist the secret but leave `totpEnabledAt` NULL until the first
  // successful verification. This prevents a user from locking themselves
  // out if they never finish the setup wizard.
  await db
    .update(accounts)
    .set({ totpSecret: setup.secret_base32 })
    .where(eq(accounts.id, body.accountId));

  return c.json({
    secret_base32: setup.secret_base32,
    otpauth_url: setup.otpauth_url,
  });
});

const TotpVerifySchema = z.object({
  accountId: z.string().uuid(),
  code: z.string().min(6).max(8),
});

router.post('/v1/accounts/totp/verify', async (c) => {
  const body = TotpVerifySchema.parse(await c.req.json());
  const rows = await db.select().from(accounts).where(eq(accounts.id, body.accountId)).limit(1);
  const account = rows[0];
  if (!account) return c.json({ error: 'not_found' }, 404);
  if (!account.totpSecret) return c.json({ error: 'totp_not_initialized' }, 400);

  const { verifyCode } = await import('../services/totp');
  if (!verifyCode(account.totpSecret, body.code)) {
    return c.json({ error: 'invalid_code' }, 401);
  }

  await db
    .update(accounts)
    .set({ totpEnabledAt: new Date() })
    .where(eq(accounts.id, body.accountId));

  return c.json({ enabled: true });
});

const TotpDisableSchema = z.object({
  accountId: z.string().uuid(),
  code: z.string().min(6).max(8),
});

router.post('/v1/accounts/totp/disable', async (c) => {
  const body = TotpDisableSchema.parse(await c.req.json());
  const rows = await db.select().from(accounts).where(eq(accounts.id, body.accountId)).limit(1);
  const account = rows[0];
  if (!account) return c.json({ error: 'not_found' }, 404);
  if (!account.totpSecret || !account.totpEnabledAt) {
    return c.json({ error: 'totp_not_enabled' }, 400);
  }

  const { verifyCode } = await import('../services/totp');
  if (!verifyCode(account.totpSecret, body.code)) {
    return c.json({ error: 'invalid_code' }, 401);
  }

  await db
    .update(accounts)
    .set({ totpSecret: null, totpEnabledAt: null })
    .where(eq(accounts.id, body.accountId));

  return c.json({ disabled: true });
});

export default router;