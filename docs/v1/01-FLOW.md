# v1 User Flow

## First run (new customer)

1. Install the app (signed installer, no admin rights)
2. Welcome screen — one paragraph, one button: "Create your lab"
3. Local signup (works offline, no Cloud needed):
   - Email, password (Argon2id, 64 MB)
   - Admin last name
   - Lab name (business name)
   - Vertical: Food (only option in v1)
4. Device identity:
   - App generates Ed25519 keypair
   - Stored in OS keychain
   - App derives DB encryption key from keychain + project_id
5. Project creation:
   - Project name (e.g. "Lab 2026")
   - Creates `projects/{id}/project.db` (encrypted, SQLCipher)
   - Runs migration 001 (11 tables)
   - Writes project metadata
6. Cloud registration (async, retryable):
   - POST /v1/accounts
   - POST /v1/devices/register (signed with device key)
   - POST /v1/projects
   - App continues whether or not this succeeds; retries in background
7. Plan screen:
   - One plan: 149 TND / month, 14-day free trial
   - "Start trial" or "Subscribe now" (Stripe or local PSP)
8. Module request:
   - GET /v1/modules/food-lab/package
   - Server issues license only if trial active or subscription paid
   - Bundle is signed (`cloud_root` in v1; `project_license` and
     `device_bind` added in v1.1)
   - App verifies signature, stores in `projects/{id}/modules/`
9. Land in the main app:
   - Dashboard loads
   - Food-lab module is loaded in Wasmtime (or in-process behind the
     trait in the first weeks of build; see 04-PHASES.md Phase 3)
10. Background tasks (start now, run forever):
    - Check app updates on launch
    - Refresh license every 7 days (if Cloud unreachable, 7-day grace,
      then read-only)
    - Nightly encrypted backup to MinIO
    - Check for data patches (none in v1; wiring present)

## Daily use

- Open app → keychain unlock → project.db opens → dashboard
- Create sample → assign tests → record results → approve → generate
  report → print/PDF
- Every write goes through `commands/*.rs`
- Every write produces one data row + one event + one audit entry,
  same transaction
- Cloud is not contacted during daily use (except periodic license
  refresh and nightly backup)

## Cloud offline

- Everything works. Only license refresh and backup pause.
- 7-day grace. After that, read-only until license refreshes.
- Read-only = can open, view, print existing reports. Cannot create
  or edit.

## Update

- App checks on launch for a new signed binary
- If available: download, verify signature, prompt, apply on restart
- Migrations run on start with pre-migration backup
- Data patches (v1.1+): signed, inspectable (non-critical), refusable
  (non-critical), audited
- Failure at any step: rollback to pre-update state