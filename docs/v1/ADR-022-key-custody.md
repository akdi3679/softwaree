# ADR-022: v1 Key Custody and the Password Boundary

**Status:** Accepted — amended 2026-11-20
**Resolves:** OPEN DECISION D-2 in `01-FLOW.md`
**Supersedes:** the "Project Key wrapped twice" design in the original
`01-FLOW.md` step 4, and the HKDF-from-device-key derivation in the
original v1 ADR-022
**Aligned with:** big-doc ADR-022 (authoritative key hierarchy),
ADR-005 (storage + backup), ADR-010 (auth + recovery)

## Context

The original v1 draft specified a single 32-byte "Project Key", wrapped by
the OS keychain key AND by an Argon2id(password) key, with the DB encryption
key derived from it.

This violates the locked architecture in three places:

- **ADR-010:** "In all cases, the customer's account password is never used
  to derive encryption keys for project data. Authentication and encryption
  are separate concerns."
- **PRINCIPLES §9** defines distinct keys with distinct purposes, not one.
- **ADR-005 / ADR-022 (big doc):** the database key is a **random 32-byte
  secret**. No key is ever derived from a signing key. An Ed25519 key
  cannot perform key derivation — HKDF over an Ed25519 private key is not
  a valid construction.

The single-key design also conflates two incompatible requirements:
at-rest encryption must be **device-bound and never escrowed**, while
backup encryption must be **escrowed and recoverable**. One key cannot be
both.

## Decision

v1 implements the big-doc ADR-022 hierarchy, scoped to what v1 uses.

### Key table (v1 scope)

| Key | v1 status | Generation | Custody |
|---|---|---|---|
| **Device Signing Key** (Ed25519) | active | Generated at first launch | OS keychain. Identity and signatures. **Never encryption, never derivation.** |
| **Device Encryption Key** (X25519) | active | Generated at first launch | OS keychain. Receives wrapped Content Keys from module bundles (ADR-007). Generated now so the bundle format and device registry are stable from day one. |
| **Project Master Key** | active | Random 32 bytes at project creation | OS keychain. Wraps `keys/keyring.enc`. |
| **Project DB Key** | active | Random 32 bytes at project creation | Inside keyring. SQLCipher encryption key for `project.db`. **Never derived from a signing key.** |
| **Project Keyring Key** | slot reserved | — | Not used in v1 (no resource keys). Wraps per-resource content keys in v1.1+. |
| **Project Blind Index Key** | slot reserved | — | Not used in v1 (no blind indexes). HMAC key for searchable sensitive fields in v1.1+. |
| **Projection Cache Key** | slot reserved | — | Not used in v1 (no Users, no projection cache). Encrypts `snapshots/projection-cache/` in v1.1+. |
| **Backup Key** | active | Random 32 bytes **per backup** | Wrapped by the Cloud's Escrow Key (HSM) in assisted mode. v1 is assisted-only; zero-knowledge mode is not offered. |
| **Manual Backup Passphrase Key** | deferred (Plan 4) | — | Never escrowed, by design. Not in v1. |

### What was removed and why

| Original v1 concept | Status | Reason |
|---|---|---|
| `HKDF-SHA256(device_key, …)` for DB key | **Removed** | Ed25519 cannot do key derivation. DB key is random 32 bytes (ADR-022, ADR-005). |
| "Project Recovery Key" intermediate layer | **Removed** | Big-doc ADR-022 has the Backup Key directly wrapped by the Cloud's Escrow Key. No intermediate layer. |
| "Outbound Sync Key" | **Removed** | Does not exist in the big doc. In v1.1, resource keys are wrapped per-member to X25519 keys at delivery time (ADR-012 §5). No separate sync key is needed. |

### D-2 resolved

**The password is required to open the app. The password derives no data key.**

- Password → Argon2id (64 MB memory cost) → authenticates the account and
  unlocks the app session.
- Password also wraps a **copy of the keyring** via Argon2id → HKDF-SHA-256,
  stored locally. This enables device-replacement recovery (the customer
  can unlock the keyring on a new device with their password). It is a
  **recovery convenience**, not a data key.
- OS keychain → supplies the Project Master Key → decrypts `keyring.enc`
  → Project DB Key.

These are two independent gates. This satisfies the ISO 17025 concern
(an unlocked Windows session must not expose lab data) **without**
violating ADR-010.

## Why recovery still works

The Project DB Key is inside the keyring, which is inside the backup
archive. The Backup Key unlocks the archive. Recovery does not need the
old device's keychain.

Recovery path (acceptance test #8):

1. New device authenticates to Cloud; old device marked `REPLACED`.
2. Cloud releases the **wrapped Backup Key** after verification;
   access is logged and audited.
3. New device decrypts the backup archive with the Backup Key →
   obtains Project Master Key + `keyring.enc` + `copy.db`.
4. New device decrypts `keyring.enc` with the Project Master Key →
   obtains Project DB Key.
5. New device opens `copy.db` with the Project DB Key.
6. Audit chain verified. Module bundles re-issued bound to the new
   device's Ed25519 public key.
7. Customer is back in business. Old device's bundles are inert.

No key is ever derived from a password. No key is ever derived from a
signing key. No custody migration is needed when v1.1 adds resource keys,
blind indexes, or projection caches — the keyring slots are already
reserved.

## Keyring file format

```
keys/keyring.enc = AES-256-GCM(
  Project Master Key,
  JCS({
    "db_key":           "<Project DB Key>",
    "keyring_key":      null,   // reserved, v1.1
    "blind_index_key":  null,   // reserved, v1.1
    "cache_key":        null    // reserved, v1.1
  })
)
```

The `keys/keyring.enc` file is included in every backup archive.
The Project Master Key is also included in the archive (encrypted by the
Backup Key), so the archive is self-contained.

## Consequences

- **Positive:** matches the locked big-doc hierarchy exactly; recovery is
  provable; theft of the disk yields nothing without the OS keychain;
  theft of the Cloud yields nothing without customer verification;
  forward-compatible with v1.1 resource keys and blind indexes.
- **Negative:** four active keys to manage instead of one. Accepted — this
  is the cost of separating at-rest secrecy from recoverability.
- **Neutral:** the app must hold the unwrapped Project DB Key only for the
  running session, never on disk.

## Enforcement

- No code path may call Argon2 on a password and use the output as a data
  encryption key. CI grep for `argon2` in any module that touches
  encryption. The password-derived key wraps the keyring for recovery
  convenience only.
- No code path may call HKDF with an Ed25519 key as input. Lint rule.
- The Project DB Key is never written to disk, logged, or sent.
- `restore_from_backup` must succeed on a device whose keypairs differ
  from the one that created the backup. This is the test that proves the
  separation is real.
- The keyring slots for Keyring Key, Blind Index Key, and Projection Cache
  Key exist in the file format as `null` from day one. Adding them in v1.1
  is a code change, not a format change.