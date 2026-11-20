# v1 User Flow

## First run (new customer)

1. Install the app (signed installer, no admin rights required).

2. Welcome screen — one paragraph, one button: "Create your lab".

3. **Local signup — works offline, no Cloud needed:**
   - Email
   - Password (Argon2id, 64 MB memory cost)
   - Admin last name
   - Lab name (business name)
   - Vertical: Food (only option in v1)

4. **Device identity and key custody (per ADR-022):**
   - App generates an **Ed25519 signing keypair** (identity, signatures).
   - App generates an **X25519 encryption keypair** (receives wrapped keys
     in v1.1; generated now so the bundle format and device registry are
     stable from day one).
   - Both private keys stored in the OS keychain. Non-exportable where the
     platform allows it.
   - **Project Master Key** = random 32 bytes, stored in the OS keychain.
     Wraps `keys/keyring.enc`.
   - **Project DB Key** = random 32 bytes, inside keyring. SQLCipher key.
     **Never derived from a signing key.** (ADR-022, ADR-005)
   - **Backup Key** = random 32 bytes per backup, AES-256-GCM.
     In v1 (assisted mode only): wrapped by the Cloud's Escrow Key.
     Zero-knowledge mode is not offered in v1.
   - The password authenticates the account and unlocks the app session.
     **It derives no encryption key.** It wraps a copy of the keyring via
     Argon2id for device-replacement recovery only. (ADR-010, ADR-022)

   > **D-2 RESOLVED by ADR-022.** The password is required to open the app;
   > the OS keychain supplies the device key. Two independent gates.
   > Auth and encryption stay separate. The unwrapped database key is held
   > for the running session only and never written to disk.
   
5. **Project creation:**
   - Project name (e.g. "Lab 2026")
   - Creates `projects/{project_id}/project.db` (SQLCipher-encrypted)
   - Runs migration 001 (17 tables)
   - Writes `laboratory_settings` + `profiles` (one admin row)
   - Writes the genesis audit entry (`project.created`, prev_hash = 64 zeros)

6. **Cloud registration — async, retryable, never blocking:**
   - `POST /v1/accounts`
   - `POST /v1/devices/register` (both public keys + signed challenge)
   - `POST /v1/projects` (metadata only: business_type, admin_last_name,
     business_name — no business data)
   - `POST /v1/projects/{id}/escrow` (the **wrapped Backup Key**; the
     Cloud cannot unwrap it without an authorized recovery event)
   - The app continues whether or not these succeed; retries in background.
   - Owner side: a row appears in `/ops/signups` and an email is sent.

7. **Plan screen:**
   - One plan: **149 TND / month**, 14-day free trial
   - "Start trial" or "Subscribe now"

   > **OPEN DECISION D-3 — payment provider.**
   > Stripe does not settle TND. Options: (a) bill EUR/USD via Stripe,
   > (b) Tunisian PSP (Konnect / Paymee / Flouci).
   > Verify whether the chosen PSP supports **recurring** charges. If it
   > only supports one-shot payments, v1 uses **prepaid periods + manual
   > renewal**, which fits the license TTL model with no design change.

8. **Module request and verification:**
   - `GET /v1/modules/food-lab/versions/{v}/package`
   - Cloud issues the bundle only if trial active or subscription paid.
   - **The bundle carries all three signatures:**
     - `cloud_root` — published by us, binary unmodified
     - `project_license` — this project is licensed, plan permits it
     - `device_bind` — bound to this specific device's public key
   - App verifies all three + the binary SHA-256, then stores it in
     `projects/{project_id}/modules/`.
   - Any failure → refuse to load, log a security event, notify Cloud.
   - **Re-verified at every load**, not just at install.

9. **Land in the main app:**
   - Dashboard loads.
   - Food-lab module loads (in-process behind the `LabModule` trait during
     Phases 3–5; Wasmtime from Phase 6).

10. **Background tasks, start now and run forever:**
    - Check app updates on launch
    - Refresh license every 7 days
    - Nightly encrypted backup
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
  timestamp the app has seen, persisted and never allowed to move
  backwards. Setting the system clock back does not extend grace.

**Read-only allowlist** (what still works after expiry):

| Allowed                        | Refused                  |
|--------------------------------|--------------------------|
| Open app, browse, search       | Create sample            |
| View samples/results/reports   | Record or edit result    |
| Print an existing report PDF   | Generate a new report    |
| Export read-only data          | Sign a report            |
| Refresh license                | Any write command        |

The customer's data is never held hostage. New work stops; existing work
remains readable and printable.

## If the laptop dies (recovery)

This flow must work before v1 ships. It is acceptance test #8.

1. Customer installs the app on a new device.
2. Customer authenticates to the Cloud (account credentials + recovery
   proof: recovery code or support-verified ownership).
3. Cloud marks the old device `REPLACED`, the new device `ACTIVE`.
4. Cloud releases the **wrapped Backup Key** to the new device after
   verification; the access is logged and audited.
5. New device unwraps the Backup Key, uses it to decrypt the latest backup.
6. New device lists backups: `GET /v1/backups?project_id=...`
7. Downloads the latest: `GET /v1/backups/{id}`
8. `restore_from_backup(blob_id)` → decrypt → open → verify audit chain.
9. Cloud re-issues module bundles bound to the **new** device key.
10. Customer is back in business. Old device's bundles are inert.

## Update

- App checks on launch for a new signed binary.
- If available: download → verify signature → prompt → apply on restart.
- Migrations run on start with a pre-migration snapshot.
- Data patches: signed, versioned, transactional, audited, dry-run first.
  Non-critical ones are inspectable and refusable (refusal is audited).
- Failure at any step before commit → transaction rollback.
- Failure discovered after commit → **restore the pre-migration snapshot.
  Never downgrade the binary.** See `03-UPDATES.md`.