
ADR-005-one-sqlite-per-project.md

# ADR-005: One SQLite File Per Project

**Status:** Accepted — amended 2026-11-22 (review pass 2)
**Date:** 2026-07-26
**Amended:** password-wrapped keyring removed, licence state moved to
admin_state.db, VACUUM INTO claim marked for Phase 0 verification,
x'hex' key format noted, PDFs/logos as BLOBs reinforced, 19 tables
(10 platform + 9 module) in v1
**Deciders:** Architecture team
**See also:** ADR-002 (authority), ADR-004 (sequence), ADR-007 / ADR-011
(module bundles), ADR-008 (snapshots), ADR-012 (table list), ADR-014
(licence state), ADR-016 (lifecycle + erasure), ADR-022 (key custody)

---

## Context

Plan 4 (Enterprise) allows one Account to have multiple projects. We must
decide how those projects share storage on the Admin's machine, how each
file is encrypted, and what a backup actually contains.

## Decision

**One SQLite database file per project.** Each project is fully isolated
at the storage layer.

~~~
/var/lib/product/projects/
├── proj_a1b2c3/
│   ├── project.db
│   ├── project.db-wal
│   └── project.db-shm
├── proj_d4e5f6/
│   └── project.db
└── proj_g7h8i9/
    └── project.db
~~~

A single Admin can host multiple project files. The project picker lists
them. The Cloud's project registry maps `account_id → list<project_id>`.

Each `project.db` contains the **19 tables** in v1 (10 platform + 9 module)
plus that project's module business tables (`mod_<name>_*`). In the final
architecture, each `project.db` contains **18 platform tables** (ADR-012)
plus module tables.

---

## Consequences

### Positive

- Strong isolation, easy to move, delete, back up.
- Different schemas per project.
- No cross-project queries (deliberate).

### Negative

- Many files at Plan 4 scale (acceptable).
- No global cross-project query (by design).

### Neutral

- The Admin's **app-level registry** (a small separate file) holds the
  project list and app preferences only. Per-member cursors live in
  `user_projections` inside each `project.db` (ADR-012).
- **Licence state and the monotonic clock anchor live in `admin_state.db`**
  (device-level), NOT in `project.db`. This prevents a backup restore from
  rolling the clock anchor back and extending the grace period. See
  ADR-014 §3 and the Device-level state section below.
- Two deletion concepts, never conflated:
  - Record-level corbeille — rows in `tombstones`, quota-bound (ADR-016).
  - Project-level deletion — whole file, Cloud registry soft-delete.

---

## Device-level state (admin_state.db)

Some state must survive project backup/restore without being captured by
it. This state lives in a **device-level** SQLite file (`admin_state.db`),
keyed by `project_id`:

| Data | Why device-level |
|---|---|
| Project registry (list of projects) | Device knows its projects |
| Device key references | Device identity |
| Monotonic clock anchor | A restore must not roll the anchor back |
| Licence cache (licence_state) | Same reason as anchor |
| Local account verifier (password hash) | Account-level, not project-level |

ADR-012's `license_state` table is therefore in `admin_state.db`, not in
`project.db`. The 18 platform tables in `project.db` (final architecture)
or 10 platform tables in v1 do not include it.

`admin_state.db` is itself SQLCipher-encrypted with its own random key
in the OS keychain. It is **excluded from project backups by an explicit
allow-list**. A counter *inside* the file cannot detect that the file itself was rolled back, so the current `state_revision` is **mirrored in the OS keychain**. On open: keychain key present but file missing, or file revision lower than the mirror ⇒ **tamper** ⇒ expiry-unknown ⇒ read-only until the next Cloud contact. Neither file nor keychain key present ⇒ **new device** ⇒ the new-device rule in ADR-014 §3.

---

## File layout

Each project directory contains exactly:

| Path | Purpose | In backup? |
|---|---|---|
| `project.db` | Platform + module tables (SQLCipher) | ✅ |
| `project.db-wal` | WAL — checkpointed before backup | ✅ (checkpointed) |
| `project.db-shm` | Shared memory, recreated on open | ❌ |
| `keys/keyring.enc` | Keyring, encrypted with Project Master Key | ✅ |
| `modules/{module}-{version}/` | Bundles (ADR-007, ADR-011) | ✅ (re-issued on restore) |
| `snapshots/recovery/` | Pre-migration / pre-patch snapshots | ❌ (local only) |
| `snapshots/projection-cache/` | Per-member sync cache, encrypted | ❌ (rebuildable) |
| `files/` | Scratch cache for rendering only. Authoritative bytes are BLOBs in the DB | ❌ |
| `exports/` | Customer-generated exports (Principle 14) | ❌ (customer's own artifact) |

**PDFs, logos, and other binary assets are stored as BLOBs inside
`project.db`**, not as external files. This ensures they are encrypted,
backed up, and survive restore. A restored lab must not lose its signed
PDFs — they are the legal record. See ADR-016 and the v1 data model.

---

## Encryption at rest

**We use SQLCipher.** SEE is commercial and is not used.

### Key model

Keys are random 32-byte secrets. No key is derived from a signing key.
Full hierarchy in ADR-022.

| Key | Scope | Lives in | Purpose |
|---|---|---|---|
| Project Master Key | per project | OS keychain | Wraps `keys/keyring.enc` |
| Project DB Key | per project | inside keyring | SQLCipher key |
| Project Keyring Key | per project | inside keyring | Wraps resource keys |
| Project Blind Index Key | per project | inside keyring | HMAC blind indexes |
| Projection Cache Key | per project | inside keyring | Encrypts cache |
| Device Signing Key | per device | OS keychain | Identity, signatures |
| Device Encryption Key | per device | OS keychain | X25519 key wrapping |
| Backup Key | per backup | wrapped | Archive encryption |

### Unlock flow

~~~
1. User unlocks the app (app-unlock password, ADR-022 §3); the OS session is already unlocked for the OS user
2. OS keychain releases the Project Master Key
3. Master Key decrypts keys/keyring.enc → DB Key, Keyring Key, etc.
4. project.db opened with DB Key (SQLCipher PRAGMA key)
5. Keys held in memory only for the session; never written in plaintext
~~~

**There is no password-wrapped keyring copy.** The password is an
app-unlock gate only (ADR-022 §3). Device replacement uses the recovery
flow or a planned transfer bundle, not a password-derived key.

For headless / service mode, the Project Master Key may additionally be
wrapped by a service unlock secret (opt-in, ADR-022).

### SQLCipher key format

The raw key must be passed to SQLCipher in `x'hex'` form:

~~~sql
PRAGMA key = "x'<64 hex chars>'";
~~~

Not as a quoted string. This is a SQLCipher requirement for raw keys.

---

## Migrations

- Each project has its own `schema_version` table, keyed `(scope, version)`.
- Migrations are plain `.sql` files embedded in the Rust binary, applied
  with `rusqlite_migration`. Drizzle is TypeScript-only, Cloud-side.
- **Forward-only.** No `down` migration in production. Recovery = restore
  from pre-migration snapshot.
- Before any migration: snapshot to `snapshots/recovery/`, then apply.
  On failure, restore that snapshot.
- Migrations run project-by-project on Admin start.
- Cloud-delivered schema changes arrive with the next **app update** (platform schema, signed by the App-Updater key) or in the **module bundle's `migrations/`** (module schema, ADR-007). Typed patches (ADR-015) carry **data changes only and never contain DDL**.
---

## Backup

A backup is one encrypted archive per project.

~~~
1. Acquire the project write lock (no new commands; drain outbox)
2. Checkpoint the WAL into the main database
3. Create an ENCRYPTED copy:
   ATTACH DATABASE 'copy.db' AS backup KEY "x'<64 hex chars of Project DB Key>'";
   SELECT sqlcipher_export('backup');
   DETACH DATABASE backup;
   ⚠️ Do NOT use VACUUM INTO here. On a SQLCipher database it may write
   a PLAINTEXT file. This claim must be verified against our pinned
   SQLCipher version at Phase 0. Regardless, the ban stands and a
   ciphertext-assertion test guards it.
4. Assemble the archive payload:
   copy.db + keys/keyring.enc + Project Master Key + module manifests
5. Generate a random 32-byte Backup Key for THIS archive
6. Encrypt the payload with AES-256-GCM using the Backup Key
7. Wrap the Backup Key:
   - assisted: wrap to the project's Escrow PUBLIC key (ADR-022 §2)
   - zero-knowledge: wrap by Argon2id(recovery code)
   - Plan 4 manual: wrap by Argon2id(passphrase), NEVER escrowed
   - local-only: wrap by Argon2id(passphrase), NEVER escrowed
8. Upload ciphertext + wrapped key to Cloud (MinIO)
   (local-only backups stay on disk)
9. Release the write lock
~~~

### Restore

~~~
1. Obtain the Backup Key:
   assisted → HSM releases and re-wraps to new device X25519 key (ADR-022)
   zero-knowledge → customer recovery code
   manual/local → customer passphrase
2. Decrypt archive → Project Master Key → keyring.enc → Project DB Key
3. Open the restored project.db
4. RE-APPLY the erasure_ledger (ADR-016) before writable
5. Register the new device as Admin (ADR-010); re-issue bundles (ADR-007)
5b. On a new device: create `admin_state.db` (with its own keychain key), store the new device keys, fetch the licence from the Cloud, and seed the clock anchor from the **signed Cloud timestamp** (ADR-014 §3). Until that first Cloud contact the project is read-only.
6. Users verify new authority certificate and resync (ADR-012)
~~~

Step 4 is mandatory: erased data must never return through a restore.

---

## Corbeille storage

Soft-deleted records live in `tombstones`. Quota = serialized byte size.
(Plan 1: local only; Plan 1+: 5 GB; Plan 2: 5 GB; Plan 3: 50 GB; Plan 4: 500 GB.)
The Cloud stores deletion metadata only. At quota, the oldest tombstone
is hard-deleted and its resource key destroyed. The 30-day recovery grace
is a property of backup retention, not a second trash can. Full semantics
in ADR-016.

---

## Alternatives Considered

**One SQLite file, project_id on every row.** Rejected: contamination risk.
**One PostgreSQL per Admin.** Rejected: desktop app, not a server.
**Per-module databases.** Rejected: cross-module queries impossible.
**SEE instead of SQLCipher.** Rejected: commercial.
**Deriving DB key from device key.** Rejected: impossible with Ed25519.
**Password-wrapped keyring copy.** Rejected: offline brute-force risk.
**External files for PDFs/logos.** Rejected: lost on restore, unencrypted.
BLOBs in DB instead.

---

## Enforcement

- Project picker reads app-level registry; Cloud authoritative, Admin caches.
- Each project opened with its own DB Key. Wrong key fails at open.
- Lint: no SQL references another project's database.
- Lint: `VACUUM INTO` forbidden. Ciphertext-assertion test guards backup.
- Backup refuses multi-project bundles.
- Backup refuses if custody mode unset.
- `snapshots/projection-cache/` and `exports/` excluded by explicit allow-list.
- Restore cannot mark writable until erasure ledger re-applied.
- PDFs and logos stored as BLOBs; lint rejects file-path columns for
  binary assets.
- `admin_state.db` is excluded from project backups by allow-list.

### Tests

- [ ] Two projects: opening A with B's key fails
- [ ] keyring.enc is ciphertext without keychain entry
- [ ] Backup archive is ciphertext; fails without Backup Key
- [ ] No plaintext DB page in backup (byte-level assertion)
- [ ] Cache and export dirs absent from archive
- [ ] Migration failure → snapshot restored, schema_version unchanged
- [ ] Restore re-applies erasure ledger
- [ ] Zero-knowledge restore with wrong code → clean failure
- [ ] Corbeille quota from serialized tombstone size matches UI
- [ ] Deleting one project leaves others operational
- [ ] Headless service starts with service-unlock wrapper
- [ ] Interactive project has no service-unlock wrapper
- [ ] licence_state and clock anchor in admin_state.db, not project.db
- [ ] Restore does not roll back the clock anchor
- [ ] PDF stored as BLOB survives backup/restore
- [ ] SQLCipher key passed in x'hex' form
- [ ] admin_state.db opened without its keychain key → fails
