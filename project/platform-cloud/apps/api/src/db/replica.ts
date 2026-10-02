/**
 * Backwards-compatibility shim.
 *
 * All replica logic now lives in `./client` to avoid a second connection
 * pool. Existing imports from `db/replica` continue to work unchanged.
 */
export { readDb, writeDb, hasReplica } from './client';