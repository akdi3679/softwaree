import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const PRIMARY_URL = process.env.DATABASE_URL;
if (!PRIMARY_URL) {
  throw new Error('DATABASE_URL is required');
}

const REPLICA_URL = process.env.DATABASE_REPLICA_URL ?? '';

type Db = PostgresJsDatabase<typeof schema>;

// ---------------------------------------------------------------------------
// Primary (write + default read)
// ---------------------------------------------------------------------------

export const primaryPostgresClient = postgres(PRIMARY_URL, {
  max: 20,
  idle_timeout: 30,
  connect_timeout: 10,
  prepare: false,
});

export const db: Db = drizzle(primaryPostgresClient, { schema });
export type Database = typeof db;

// ---------------------------------------------------------------------------
// Optional read replica
//
// When DATABASE_REPLICA_URL is unset (default), `readDb()` returns the
// primary and every code path behaves exactly as before. When it is set,
// `readDb()` returns a separate connection pool sized for read traffic.
//
// Routes are migrated incrementally: read-only endpoints call `readDb()`,
// write endpoints keep using `db`. This is safe to ship with no replica
// configured, because the function is a passthrough.
// ---------------------------------------------------------------------------

let replicaClient: ReturnType<typeof postgres> | null = null;
let _replicaDb: Db | null = null;

if (REPLICA_URL) {
  replicaClient = postgres(REPLICA_URL, {
    max: 50,
    idle_timeout: 30,
    connect_timeout: 10,
    prepare: false,
  });
  _replicaDb = drizzle(replicaClient, { schema });
}

/** Read path. Uses the replica if configured, else primary. */
export function readDb(): Db {
  return _replicaDb ?? db;
}

/** Write path. Always primary. */
export function writeDb(): Db {
  return db;
}

/** Is a read replica configured? */
export function hasReplica(): boolean {
  return _replicaDb !== null;
}

/** Raw replica client (for pool monitoring). Null when no replica. */
export const replicaPostgresClient = replicaClient;