# ADR-005: One SQLite File Per Project

**Status:** Accepted — amended 2026-11-20
**Date:** 2026-07-26
**Amended:** 2026-11-20 — SQLCipher chosen explicitly, correct key model (random keys, never derived from a signing key), snapshot directories split, corbeille quota defined, backup procedure made cryptographically precise, cursor location clarified, headless service-unlock added
**Deciders:** Architecture team
**See also:** ADR-002 (authority), ADR-004 (sequence), ADR-007 / ADR-011 (module bundles), ADR-008 (snapshots), ADR-012 (table list), ADR-014 (licence state), ADR-016 (lifecycle + erasure), ADR-022 (key custody — authoritative hierarchy)

---

## Context

Plan 4 (Enterprise) allows one Account to have multiple projects. We must decide how those projects share storage on the Admin's machine, how each file is encrypted, and what a backup actually contains.

## Decision

**One SQLite database file per project.** Each project is fully isolated at the storage layer.

```
/var/lib/product/projects/
├── proj_a1b2c3/
│   ├── project.db          ← platform tables + module business tables
│   ├── project.db-wal      ← SQLite write-ahead log
│   └── project.db-shm      ← SQLite shared memory
├── proj_d4e5f6/
│   └── project.db
└── proj_g7h8i9/
    └── project.db
```

A single Admin can host multiple project files. The Admin's project picker lists them. The Cloud's project registry maps `account_id → list<project_id>`.

Each `project.db` contains the **18 platform tables** listed in ADR-012 plus that project's module business tables (`mod_<name>_*`). These platform tables are **project-scoped** — there is no database shared between projects.

---

## Consequences

### Positive
- **Strong isolation.** A corrupt `project.db` only kills that project. Migrations, backups and restores are per-project.
- **Easy to move a project.** Copy the directory to another Admin machine, unwrap the keyring with the recovered Backup Key, and the project follows.
- **Easy to delete a project.** Delete the directory and mark the project deleted in the Cloud registry.
- **Easy to back up.** One encrypted archive per project. No partial dumps.
- **Different schemas per project.** Plan 4 customers can run a different mix of modules. The file is the natural unit.
- **No cross-project queries.** Deliberate: "every project is independent."

### Negative
- **Many files.** At Plan 4 scale a single Admin may host 10+ projects. SQLite and every modern filesystem handle this comfortably; the project picker is the UI.
- **No "all patients across all my projects" query.** By design. Cross-project reporting would be a separate module that opens each project with explicit authorisation.
- **More keys to manage.** Four project-scoped keys plus a master wrapper (below). Mitigated by one keyring file and one keychain entry per project.

### Neutral
- The Admin's **app-level registry** (a small separate SQLite file or JSON config) holds the project list and app preferences **only**. Per-member cursors live in `user_projections` **inside each `project.db`**, because they must be transactional with `events` and `outbox` (ADR-012).
- Two different deletion concepts, never conflated:
  - **Record-level corbeille** — rows in the project's `tombstones` table, quota-bound (ADR-016).
  - **Project-level deletion** — the whole file, soft-deleted in the Cloud registry with a 30-day grace before the blob is purged.

---

## File layout

Each project directory contains exactly:

| Path | Purpose | In backup? |
|---|---|---|
| `project.db` | Platform tables + module business tables (SQLCipher-encrypted) | ✅ |
| `project.db-wal` | SQLite WAL — checkpointed before backup | ✅ (checkpointed into the copy) |
| `project.db-shm` | Shared memory, recreated on open | ❌ |
| `keys/keyring.enc` | The project's keyring, encrypted with the Project Master Key | ✅ |
| `modules/{module}-{version}/` | Installed module bundles: manifest + 3 signatures + cert chain + `binary.wasm.enc` + `ui/` (ADR-007, ADR-011) | ✅ (re-issued to a new device on restore) |
| `snapshots/recovery/` | Local pre-migration and pre-patch snapshots (ADR-008, ADR-015) | ❌ (local only) |
| `snapshots/projection-cache/` | Per-member sync snapshot cache, encrypted, keyed by permission version (ADR-008) | ❌ (rebuildable) |
| `exports/` | Customer-generated exports (Principle 14) | ❌ (customer's own artifact) |

`keys/` and `modules/` are encrypted at rest. A plain SQLite file on disk is not acceptable.

---

## Encryption at rest

**We use SQLCipher.** SEE (SQLite Encryption Extension) is a commercial product and is **not** used. This is a decision, not an option list.

### Key model

Keys are **random 32-byte secrets**. No key is ever derived from a signing key: an Ed25519 signing key cannot perform key derivation, and one key must never serve two purposes.

| Key | Scope | Lives in | Purpose |
|---|---|---|---|
| **Project Master Key** | per project | OS keychain | Wraps `keys/keyring.enc` |
| **Project DB Key** | per project | inside keyring | SQLCipher encryption of `project.db` |
| **Project Keyring Key** | per project | inside keyring | Wraps per-resource content keys in `resource_keys` (ADR-016) |
| **Project Blind Index Key** | per project | inside keyring | HMAC blind indexes for searchable sensitive fields (ADR-016) |
| **Projection Cache Key** | per project | inside keyring | Encrypts `snapshots/projection-cache/` (ADR-008) |
| Device Signing Key (Ed25519) | per device | OS keychain | Identity, signatures — **never encryption** |
| Device Encryption Key (X25519) | per device | OS keychain | Receives wrapped module Content Keys (ADR-007) |
| Backup Key | per backup | see ADR-022 | Encrypts one backup archive |

ADR-022 is the authoritative hierarchy; this table is the storage view of it.

### Unlock flow

```
1. User authenticates to the OS (biometric / OS account / password)
2. OS keychain releases the Project Master Key
3. Master Key decrypts keys/keyring.enc → DB Key, Keyring Key, Blind Index Key, Cache Key
4. project.db is opened with the DB Key (SQLCipher PRAGMA key)
5. Keys are held in memory only for the session; never written in plaintext
```

For device replacement, the keyring is **also** wrapped by an Argon2id-derived key from the customer's password, so a legitimate customer can unlock a restored project on new hardware. That wrapper wraps a random key — it is never itself the database key.

**Headless / service mode.** When the Admin runs headless on an always-on mini-PC (ADR-002), there is no interactive biometric prompt. For that mode only, the Project Master Key is additionally wrapped by a **service unlock secret** held in the OS service-account credential store (Windows DPAPI under the service account, or the headless Secret Service provider, or a TPM-sealed key where available). The service unwraps automatically at start. This is **opt-in per project** and documented as a deliberate trade: it weakens stolen-disk protection for that project (disk + service secret unlocks it), in exchange for unattended operation. Interactive desktop projects do not use it.

If the device is stolen, the thief needs the OS account credentials to reach the keychain. The keys are not extractable without them.

---

## Migrations

- Each project has its own `schema_version` table.
- Migrations are **plain `.sql` files embedded in the Rust binary**, applied with `rusqlite_migration`. Drizzle is TypeScript-only and stays Cloud-side (see `03-STACK.md`).
- **Forward-only.** There is no `down` migration in production. Recovery is a restore from the pre-migration snapshot.
- Before any migration: write a snapshot to `snapshots/recovery/`, then apply. On failure, restore that snapshot.
- Migrations run project-by-project on Admin start, never all projects at once, never holding a lock across projects.
- Cloud-delivered schema changes arrive as typed patches under ADR-015, with the same snapshot-first rule.

---

## Backup

A backup is **one encrypted archive per project**. The procedure is precise because a wrong step here silently produces plaintext.

```
1. Acquire the project write lock (no new commands; drain the outbox)
2. Checkpoint the WAL into the main database
3. Create an ENCRYPTED copy:
     ATTACH DATABASE 'copy.db' AS backup KEY '<Project DB Key>';
     SELECT sqlcipher_export('backup');
     DETACH DATABASE backup;
   ⚠️ Do NOT use VACUUM INTO here — on a SQLCipher database it writes a
      PLAINTEXT file. This is a reviewed, lint-guarded rule.
4. Assemble the archive payload:
     copy.db + keys/keyring.enc + Project Master Key + module manifests
5. Generate a random 32-byte Backup Key for THIS archive
6. Encrypt the payload with AES-256-GCM using the Backup Key
7. Wrap the Backup Key according to the project's custody mode (ADR-022):
     - assisted (default): wrapped by the Cloud's HSM escrow key
     - zero-knowledge:     wrapped by Argon2id(customer recovery code)
     - Plan 4 manual:      wrapped by Argon2id(customer passphrase), NEVER escrowed
8. Upload ciphertext + wrapped key to the Cloud (MinIO)
9. Release the write lock
```

The whole process is per-project and non-blocking for other projects on the same Admin.

### Restore

```
1. Obtain the Backup Key (escrow release per ADR-022, or the customer's
   recovery code / passphrase)
2. Decrypt the archive → Project Master Key → keyring.enc → Project DB Key
3. Open the restored project.db
4. RE-APPLY the erasure_ledger (ADR-016) before the project becomes writable
5. Register the new device as Admin (ADR-010); re-issue device-bound module
   bundles (ADR-007)
6. Users verify the new Admin authority certificate and resync (ADR-012)
```

Step 4 is mandatory: erased data must never return through a restore.

---

## Corbeille storage

Soft-deleted records live in the project's `tombstones` table. **The plan quota is measured as the serialized byte size of that table** (Plan 1: local only; Plan 2: 5 GB; Plan 3: 50 GB; Plan 4: 500 GB). The Cloud stores deletion metadata only, never the deleted content. At quota, the oldest tombstone is hard-deleted and its resource key destroyed; the 30-day recovery grace is a property of backup retention, not a second trash can. Full semantics in ADR-016.

---

## Alternatives Considered

### One SQLite file, `project_id` on every row
**Pros:** one file, cross-project queries, one backup.
**Cons:** cross-project contamination risk, harder to move or delete one project, harder to host projects on different machines.
**Rejected:** "every project is independent" is stronger than the convenience of one file.

### One PostgreSQL instance per Admin
**Pros:** familiar to SQL developers.
**Cons:** requires a database server on a customer desktop; heavier; not embedded; contradicts Tauri's small-binary model.
**Rejected:** the Admin is a desktop app that also serves the mesh, not a database server.

### Per-module databases
**Pros:** maximum module isolation.
**Cons:** cross-module queries (patient ↔ appointment) become expensive or impossible; multi-file backup.
**Rejected:** table-prefix isolation inside one file gives the same guarantee at lower cost.

### SEE instead of SQLCipher
**Pros:** official SQLite product.
**Cons:** commercial licence, cost per deployment, no advantage for our threat model.
**Rejected:** SQLCipher is open source and sufficient.

### Deriving the DB key from the device key
**Pros:** no extra key to store.
**Cons:** technically impossible with a signing key, and key reuse across purposes is a defect.
**Rejected:** random keys, one purpose each.

---

## Enforcement

- The project picker reads the app-level registry; the Cloud is authoritative for the registry and the Admin caches it.
- Each project file is opened with **its own** DB Key. A wrong key fails immediately at open.
- Lint: no SQL string may reference another project's database or attach a second project file.
- Lint: **`VACUUM INTO` is forbidden** anywhere in the codebase. Encrypted copies use `sqlcipher_export` into an attached, keyed database.
- Backup code refuses to bundle multiple projects into one archive.
- Backup code refuses to run if the custody mode is unset — the customer must have chosen assisted or zero-knowledge (ADR-022).
- `snapshots/projection-cache/` and `exports/` are excluded from backups by an explicit allow-list, not by a glob.
- Restore code cannot mark a project writable until the erasure ledger has been re-applied.

### Tests
- [ ] Two projects on one Admin: opening A with B's key fails
- [ ] `keyring.enc` on disk is ciphertext without the keychain entry
- [ ] Backup archive is ciphertext; opening it without the Backup Key fails
- [ ] Backup contains no plaintext DB page (byte-level assertion)
- [ ] Cache and export directories absent from the archive
- [ ] Migration failure → pre-migration snapshot restored, `schema_version` unchanged
- [ ] Restore re-applies the erasure ledger; erased resource stays unreadable
- [ ] Zero-knowledge restore with a wrong recovery code → fails cleanly, no partial state
- [ ] Corbeille quota computed from serialized tombstone size matches the UI figure
- [ ] Deleting one project leaves the others fully operational
- [ ] Headless service starts unattended with the service-unlock wrapper
- [ ] Interactive project does not use the service-unlock wrapper