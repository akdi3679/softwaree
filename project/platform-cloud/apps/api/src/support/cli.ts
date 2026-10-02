#!/usr/bin/env tsx
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { auditEntries } from "../db/schema/audit";

const actorUserId = process.argv[2];
if (!actorUserId) {
  console.error("Usage: tsx src/support/cli.ts <actor_user_id>");
  process.exit(1);
}

const rows = await db
  .select()
  .from(auditEntries)
  .where(eq(auditEntries.actorUserId, actorUserId))
  .orderBy(desc(auditEntries.occurredAt))
  .limit(200);

console.table(rows);
process.exit(0);