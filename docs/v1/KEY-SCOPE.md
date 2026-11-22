
KEY-SCOPE.md
# v1 Key Scope — Which Keys Are Active

**Status:** Locked
**Supersedes:** the former `v1/ADR-022-key-custody.md` (deleted; content
merged into big-doc ADR-022 and this file)
**Authoritative hierarchy:** `docs/architecture/02-DECISIONS/ADR-022-key-custody-and-recovery.md`

This file records **which keys from the big-doc hierarchy are active in v1**
and which are deferred. It is a scope document, not a second key hierarchy.
If it disagrees with big-doc ADR-022, the big doc wins.

## Active in v1

| Key | Generation | Custody | v1 use |
|---|---|---|---|
| **Device Signing Key** (Ed25519) | First launch | OS keychain | Identity, bundle `device_bind` verification, audit signatures |
| **Device Encryption Key** (X25519) | First launch | OS keychain | Unwraps module Content Keys; receives transfer bundles |
| **Project Master Key** | Project creation | OS keychain | Wraps `keys/keyring.enc` |
| **Project DB Key** | Project creation | Inside keyring | SQLCipher key for `project.db`. **Random 32 bytes. Never derived from a signing key.** |
| **Backup Key** | Per backup | Random 32 B, wrapped to Cloud Escrow **public** key | AES-256-GCM archive encryption |

## Deferred (slot reserved, not used in v1)

| Key | Arrives in | Why deferred |
|---|---|---|
| Project Keyring Key | v1.1 (Users) | Wraps per-resource content keys; no Users in v1 |
| Project Blind Index Key | v1.1 (Users) | HMAC search tokens; no encrypted-field search in v1 |
| Projection Cache Key | v1.1 (Users) | Encrypts per-member snapshot caches; no Users in v1 |
| Recovery Code Wrapping Key | Post-v1 (zero-knowledge mode) | v1 is assisted-mode only |
| Manual Passphrase Wrapping Key | Plan 4 | Not offered in v1 |
| Local Backup Passphrase Key | Post-v1 | "Take local backup" in read-only mode; wired but not shipped |

The keyring file format reserves `null` slots for the deferred keys from
day one (big-doc ADR-022 §Keyring file format). Adding them in v1.1 is a
code change, not a format change.

## The password boundary (D-2, resolved)

**The password is required to open the app. The password derives no data key.**

- Password → Argon2id (64 MB) → authenticates the session. Hash stored in
  `admin_state.db` → `local_accounts` (device-level, never in project backups).
- OS keychain → Project Master Key → keyring → Project DB Key.
- Two independent mechanisms: the password gates the UI, the keychain holds the keys. Password guessing never yields a key. A process running as the same OS user can read the keychain (THREAT-MODEL A16).
- **There is no password-wrapped keyring copy.** A thief with the disk cannot
  brute-force the password offline to reach the keys (big-doc ADR-022 §3).

## Escrow model (corrected)

The Backup Key is random **per backup**. Nothing is escrowed "at creation."

1. Project registration returns the project's **Escrow public key** (X25519).
2. Every backup wraps its own Backup Key to that public key and uploads
   ciphertext + wrapped key.
3. Recovery: HSM unwraps, re-wraps to the **new device's X25519 key**,
   after 2FA + 48 h wait + alerts + quorum approval (big-doc ADR-022 §3).
4. There is no `POST /v1/projects/{id}/escrow` endpoint. The escrow public
   key comes from `POST /v1/projects` (registration response) or
   `GET /v1/projects/{id}/escrow-public-key`.

## Device replacement (planned, old device available)

Transfer bundle: Project Master Key + keyring contents, wrapped to the
**new** device's X25519 public key. Transferred via LAN or USB. No Cloud
involvement, no password-derived key.

## Enforcement (v1-specific)

- No code path may call Argon2 on the **account password** and use the output as
  key material. Argon2id on a **backup passphrase** is required and permitted.
  Separate functions, distinct input types; CI asserts the account-password type
  never reaches a key-derivation function.
- No code path may call HKDF with an Ed25519 key as input. Lint rule.
- The Project DB Key is never written to disk, logged, or sent.
- `restore_from_backup` must succeed on a device whose keypairs differ
  from the one that created the backup.
- SQLCipher key passed in `x'hex'` form (ADR-005).
