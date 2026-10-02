import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import { accounts } from "../db/schema/accounts";
import { emailVerifications } from "../db/schema/email-verifications";
import { sendVerificationEmail } from "../email/send";
import { hashPassword } from "../crypto/password";

export const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12).max(128),
  display_name: z.string().min(1).max(100),
  agreed_to_terms: z.literal(true),
});

export interface SignupResult {
  account_id: string;
  requires_verification: boolean;
  verification_token?: string;
}

const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";

function randomId(len: number): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET[bytes[i]! % 32];
  }
  return out;
}

export async function signup(
  input: z.infer<typeof SignupSchema>,
): Promise<SignupResult> {
  const existing = await db
    .select()
    .from(accounts)
    .where(eq(accounts.email, input.email))
    .limit(1);
  if (existing.length > 0) {
    // Don't leak whether the email is taken
    return { account_id: "pending", requires_verification: true };
  }

  const passwordHash = await hashPassword(input.password);
  const accountId = `acct_${randomId(22)}`;

  await db.insert(accounts).values({
    id: accountId,
    primaryUserId: accountId,
    email: input.email,
    passwordHash,
    displayName: input.display_name,
    plan: "local",
    status: "pending_verification",
  });

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  await db.insert(emailVerifications).values({
    accountId,
    tokenHash,
    expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
  });

  await sendVerificationEmail(input.email, token);

  return {
    account_id: accountId,
    requires_verification: true,
    verification_token: process.env.NODE_ENV === "development" ? token : undefined,
  };
}

export async function verifyEmail(token: string): Promise<{ account_id: string }> {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const rows = await db
    .select()
    .from(emailVerifications)
    .where(eq(emailVerifications.tokenHash, tokenHash))
    .limit(1);
  const row = rows[0];
  if (!row) throw new Error("invalid token");
  if (row.expiresAt.getTime() < Date.now()) throw new Error("token expired");
  if (row.consumedAt !== null) throw new Error("token already used");

  await db
    .update(accounts)
    .set({ status: "active", emailVerifiedAt: new Date() })
    .where(eq(accounts.id, row.accountId));

  await db
    .update(emailVerifications)
    .set({ consumedAt: new Date() })
    .where(eq(emailVerifications.id, row.id));

  return { account_id: row.accountId };
}