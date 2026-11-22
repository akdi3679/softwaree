
01-FLOW.md
# v1 User Flow

**Status:** Locked
**Amended:** review pass 2 — key custody corrected (password is unlock-only,
no wrapped keyring; per-backup escrow), 2FA added to registration, read-only
allow-list expanded, recovery ceremony aligned with ADR-022

## First run (new customer)

1. Install the app (signed installer, no admin rights required).

2. Welcome screen — one paragraph, one button: "Create your lab".

3. **Local signup — works offline, no Cloud needed:**
   - Email
   - Password (Argon2id, 64 MB memory cost)
   - Admin last name
   - Lab name (business name)
   - Vertical: Food (only option in v1)
   
   The password is an **app-unlock gate only**. It is stored as a hash in
   `admin_state.db` → `local_accounts` (device-level, never in `project.db`,
   never in backups). It derives **no encryption key**.

4. **Device identity and key custody (per ADR-022):**
   - App generates an **Ed25519 signing keypair** (identity, signatures).
   - App generates an **X25519 encryption keypair** (receives wrapped keys).
   - Both private keys stored in the OS keychain. Non-exportable where the
     platform allows it.
   - **Project Master Key** = random 32 bytes, stored in the OS keychain.
     Wraps `keys/keyring.enc`.
   - **Project DB Key** = random 32 bytes, inside keyring. SQLCipher key.
     **Never derived from a signing key.**
   - There is **no password-wrapped keyring copy**. A thief with the disk
     cannot brute-force the password to reach the keys.
   - **Backup Keys** are generated fresh per backup (random 32 bytes),
     wrapped to the project's **Escrow public key** (received from Cloud
     at registration). The Cloud cannot unwrap without the HSM and the
     recovery ceremony.

   > **D-2 RESOLVED by ADR-022.** The password gates the **app UI**; the OS keychain holds the **keys**. They are independent: guessing the password never yields a key, and no key is derived from it. **Honest limit:** a process running as the same OS user can read the keychain entries, so the password is **not** protection against local malware (THREAT-MODEL A16). The unwrapped database key is held for the running session only and never written to disk.

5. **Project creation** — one platform command, `create_project`, in ONE transaction:
    - creates `projects/{project_id}/project.db` (SQLCipher) and runs the **`platform` migration scope (10 empty tables)**; the 9 module tables are created when the module is installed (step 8);
   - emits platform events through `apply_event`: `project.created` (→ `project_meta`, the four creation fields) and `profile.created` (→ `profiles`, one admin row), actor `system:setup`;
   - appends the genesis audit entry (`project.created`, prev_hash = 64 zeros);
   - registers the project in `admin_state.db` → `project_registry`.
   Nothing is inserted directly: locks 1 and 10 apply to project creation too. Settings defaults and reference data are **not** created here (step 8).

6. **Cloud registration — async, retryable, never blocking:**
   - `POST /v1/accounts` (email + password)
   - **`POST /v1/accounts/mfa/enroll` — mandatory second factor**
     (TOTP or WebAuthn). Cloud refuses to issue certificates without it.
   - `POST /v1/devices/register` (both public keys + signed challenge)
   - `POST /v1/projects` (metadata only: business_type, admin_last_name,
     business_name — no business data). Response includes the project's
     **Escrow public key** for per-backup wrapping.
   - **There is no `POST /v1/projects/{id}/escrow` endpoint.** The escrow
     public key comes from `POST /v1/projects` (registration) or
     `GET /v1/projects/{id}/escrow-public-key`. Each backup wraps its own
     Backup Key to that public key.
   - The app continues whether or not these succeed; retries in background.
   - Owner side: a row appears in `/ops/signups` and an email is sent.

7. **Plan screen:**
   - One plan: **Plan 1+ (Solo Cloud) — 149 TND / month**, 14-day free trial
   - "Start trial" or "Subscribe now"
   - Starting the trial or subscribing calls `POST /v1/projects/{id}/activate`, which returns the signed licence, the licence certificate and the Admin authority certificate (the Escrow public key was returned at registration in step 6).

   > **OPEN DECISION D-3 — payment provider.**
   > Stripe does not settle TND. Options: (a) bill EUR/USD via Stripe,
   > (b) Tunisian PSP (Konnect / Paymee / Flouci).
   > Verify whether the chosen PSP supports **recurring** charges. If it
   > only supports one-shot payments, v1 uses **prepaid periods + manual
   > renewal**, which fits the license TTL model with no design change.
   > The payment provider is an **interface** (big-doc ADR-014 / 03-STACK §A.1);
   > the provider choice stays open.

8. **Module request and verification:**
   - `GET /v1/modules/food-lab/versions/{v}/package`
   - Cloud issues the bundle only if trial active or subscription paid.
   - **The bundle carries all three signatures:**
     - `cloud_root` — published by us, binary unmodified (module_hash, signed once at publish)
     - `project_license` — this project is licensed, plan permits it (bundle_hash, per device)
     - `device_bind` — bound to this specific device's public key (per device)
   - App verifies all three + binary SHA-256 + ciphertext SHA-256, then
     stores it in `projects/{project_id}/modules/`.
   - Install then runs the module's **migration scope `food-lab`** (9 empty `mod_food_lab_*` tables) inside the install transaction, after a pre-migration snapshot (ADR-006).
   - The module's `initialise` command then emits events that create the `mod_food_lab_settings` defaults and the **reference data** (parameters, categories, standards). Migrations never insert rows. In Phases 3–5, while the module is embedded, it runs at first launch.
   - Any failure → refuse to load, log a security event, notify Cloud.
   - **Re-verified at every load**, not just at install.

9. **Land in the main app:**
   - Dashboard loads.
   - Food-lab module loads (in-process behind the `LabModule` trait during
     Phases 3–5; Wasmtime from Phase 6a).
   - UI talks to the module through the **HostClient interface**. The Tauri
     adapter is used in Phases 3–6a; the **Bridge adapter lands in Phase 6b**,
     inside v1, when the UI moves into the sandboxed iframe. Same pages,
     no rewrite (ADR-011).

10. **Background tasks, start now and run forever:**
    - Check app updates on launch
    - Refresh license every 7 days
    - Nightly encrypted backup (with per-backup Backup Key wrapped to Escrow public key)
    - Check for signed data patches (none in v1; wiring present)
    - Anchor the audit chain head hash to the Cloud (hash only, no data)

## Daily use

- Open app → password → keychain unwrap → `project.db` opens → dashboard
- Create sample → assign tests → record results → ICMSF verdict →
  generate report → sign → print/PDF
- Every write goes through `commands/*.rs`
- Every write produces data row(s) + event(s) + audit entry, **one transaction**
- Cloud is not contacted during daily work

## Cloud offline

Everything works. Only license refresh, backup upload, and audit anchoring
pause.

- License TTL 30 days, refreshed every 7 days.
- If Cloud unreachable: **14-day grace**, then read-only.
- Grace is measured against a **monotonic anchor**: the last signed
  timestamp the app has seen, persisted in `admin_state.db`
  (`license_state` table) and never allowed to move backwards.
  Setting the system clock back does not extend grace.
  **Restoring an old backup does not extend grace either** — the anchor
  is device-level, not captured in project backups (ADR-014).

**Read-only allowlist** (what still works after expiry):

| Allowed                        | Refused                  |
|--------------------------------|--------------------------|
| Open app, browse, search       | Create sample            |
| View samples/results/reports   | Record or edit result    |
| Print an existing report PDF   | Generate a new report    |
| Export read-only data          | Sign a report            |
| Refresh license                | Any write command        |
| **Take local backup**          | Upload backup to Cloud   |
| **Verify audit chain**         | Restore from corbeille (a write) |
| **Export the full project**    | Install a new module     |

The customer's data is never held hostage. New work stops; existing work
remains readable, printable and exportable (Principle 14).

## If the laptop dies (recovery)

This flow must work before v1 ships. It is acceptance test #8.

1. Customer installs the app on a new device.
2. Customer authenticates to the Cloud (account credentials + **mandatory
   second factor** + recovery proof).
3. Cloud opens a recovery case:
   - **alerts EVERY contact on the account, out of band, with a cancel link**
   - **starts a mandatory 48-hour waiting period**
   - notifies the Admin device of record, if reachable
4. **Quorum approval** (configurable per ADR-013):
   - Default: 2 staff members (owner role) independently approve
   - Solo-owner mode (`approvals_required = 1`): 1 hardware-key approval
     + mandatory 24-hour delay + customer alert
   - `approver_id != requester_id` enforced in code (relaxed only in solo mode)
5. After waiting period AND approvals:
   - HSM unwraps the latest backup's Backup Key
   - HSM re-wraps it to the **new device's X25519 public key**
   - Access logged in the owner audit chain (ADR-013)
6. Cloud marks the old device `REPLACED`, the new device `ACTIVE`,
   issues a new Admin authority certificate, bumps `revocation_epoch`.
7. New device lists backups: `GET /v1/projects/{id}/backups`
8. Downloads the latest: `GET /v1/projects/{id}/backups/{backupId}`
9. `restore_from_backup(blob_id)`:
   - Unwrap Backup Key with new device's X25519 private key
   - Decrypt archive → Project Master Key → keyring → Project DB Key
   - Open the restored `project.db`
   - **Re-apply `erasure_ledger`** (big-doc ADR-016) before writable
   - Verify audit chain
10. Cloud re-issues module bundles bound to the **new** device key.
11. Customer is back in business. Old device's bundles are inert.

**Planned device move (old device still available):**
  Skips the escrow release and the 48-hour wait. The old device creates a **transfer bundle** (Project Master Key + keyring contents wrapped to the new device's X25519 pubkey), moved via LAN or USB; the new device unwraps it with its X25519 private key. **The Cloud is still contacted** to register the replacement (`POST /v1/devices/{id}/replace`), issue the new Admin authority certificate and re-issue module bundles; until that first contact the new device is read-only (ADR-014 §3). No password-derived key is involved.

## Update

- App checks on launch for a new signed binary.
- If available: download → verify signature → prompt → apply on restart.
- Migrations run on start with a pre-migration snapshot.
- Data patches: signed, versioned, **typed operations only** (never raw SQL),
  compiled to SQL locally by the typed-op compiler, with protected-table
  enforcement (big-doc ADR-015). Dry-run first.
  Non-critical ones are inspectable and refusable (refusal is audited).
- Critical patches have a deadline. Past the deadline → **restricted mode**
  (writes refused; read, export, print, local backup remain available).
- Failure at any step before commit → transaction rollback.
- Failure discovered after commit → **restore the pre-migration snapshot.
  Never downgrade the binary.** See `03-UPDATES.md`.

## Local-only backups

For Plan 1 (if offered later) and the "take local backup" option in
read-only mode: the Backup Key is wrapped by Argon2id(passphrase),
**never escrowed**. The customer chooses the passphrase at backup time.
Forgotten passphrase = unrecoverable local backup. This is stated plainly
in the UI before the backup is created.
