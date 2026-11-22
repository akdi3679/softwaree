# Threat Model

> **Status:** Living document — reviewed each release, audited before public launch
> **Last updated:** 2026-11-22
> **Scope:** Admin app, User app, modules and module UI, Cloud public API, Owner Console, discovery, blind relay, backup and recovery, the mesh

---

## 1. Assets, in priority order

| # | Asset | Where | Impact if compromised |
|---|---|---|---|
| 1 | Project business data (medical, lab) | Admin `project.db` | Regulatory breach, patient harm, business-ending |
| 2 | Cloud root / licence / **patch** signing keys | HSM; patch key offline | Fleet-wide code or data execution |
| 3 | **App-updater signing key** | **Offline / cold** | **Code execution on every Admin PC** — worse blast radius than a bad patch key |
| 4 | Backup keys (Backup Key, Escrow Key) | HSM / customer recovery code | Mass decryption of historical data |
| 5 | Device private keys (Ed25519, X25519) | OS keychain | Impersonation, module decryption |
| 6 | Project data keys (DB, Keyring, Blind Index, Cache) | Keychain + keyring | Local data decryption |
| 7 | Audit chain integrity | Admin + Cloud snapshots | Loss of the compliance guarantee we sell |
| 8 | Availability of the Admin | Customer device | Whole project read-only |
| 9 | Endpoint metadata | Discovery | Privacy loss, contact-graph inference |

---

## 2. Trust boundaries

```text
[ Customer machine ]─────────────── mesh (E2E) ───────────────[ Customer machine ]
Admin: trusted for its own project                          User: untrusted writer
Modules + module UI: UNTRUSTED even though we signed them
│
│ HTTPS (control plane only)
▼
[ Cloud public API ]  untrusted to the product; holds no business data
│
│ ops VPN only, never routed publicly
▼
[ Owner Console + signing service ]  highest privilege; quorum, audited
│
[ Blind relay ]  untrusted forwarder; ciphertext only, no keys
```

Two boundaries people get wrong:

- **The Admin trusts no module.** Signing proves origin, not safety (Principle 7).
- **The Cloud is not trusted by the product to be online.** Certificates verify locally (ADR-012).

---

## 3. Adversaries and mitigations

### A1 — Malicious or patched client (customer-side)

**Goal:** run unpaid modules, exceed plan limits, forge entitlements.

**Mitigations:** entitlements are what the Cloud will **sign** (ADR-014); bundles encrypted to the device's X25519 key (ADR-007); load-time re-verification; server-side re-validation of every request (Principle 7); no `if plan == X` capability branches.

**Residual:** a patched client can skip local checks, but gains nothing the Cloud refuses to sign, and cannot decrypt content it holds no key for. **Not absolute DRM** — stated publicly.

### A2 — Stolen Admin device

**Goal:** read the project database.

**Mitigations:** SQLCipher with a random DB key; keys in the OS keychain, non-exportable where the platform allows; keyring wrapped by the Project Master Key; no plaintext key on disk (ADR-005, ADR-022).

**Residual:** a thief with the OS account credentials and biometric can unlock. Full-disk encryption and OS hygiene are the customer's responsibility, and we say so in onboarding.

### A3 — Account takeover + social engineering of support

**Goal:** trigger a recovery and obtain the plaintext of a project.

**This is the shortest real attack path in the whole system.**

**Mitigations:** mandatory second factor on every account (ADR-010); recovery requires second-factor re-auth, a **48-hour wait**, **out-of-band alerts to every contact with a cancel link**, **quorum approval** (default 2, solo mode 1 with delay), and a full audit trail; **security questions are never accepted**; break-glass is time-boxed and loud (ADR-013, ADR-022); contact, password and second-factor changes take effect after a **7-day cooling-off** and alert every existing contact; the signup email is permanent (ADR-010); an open recovery case keeps its alert list.

**Residual:** a patient, well-resourced attacker who controls the account's email and phone for 48 hours could succeed in assisted mode. Customers who cannot accept that choose **zero-knowledge mode**, where no staff path exists.

### A4 — Compromised Cloud public API

**Goal:** read customer data; sign malicious modules; issue patches.

**Mitigations:** the Cloud holds **no business data**; signing runs in a separate process/HSM the API cannot call directly; the **patch key is offline** and separate again; `/ops/*` is not routed publicly; discovery holds only endpoint metadata.

**Residual:** metadata exposure (accounts, endpoints, lookup intent, backup sizes). Painful, not a data breach. In assisted mode the **recovery service** holds a plaintext Backup Key in memory during a release (KMS unwrap returns it to the caller); it is isolated, minimal, audited and never logs key material (ADR-022 §2).

### A5 — Compromised module-signing key

**Goal:** distribute a malicious module fleet-wide.

**Mitigations:** key separation (root vs signing service vs licence vs patch); signing-service certificates rotate every 90 days and are revocable; quorum publish approval; ring rollouts; module sandbox limits what a malicious module can reach anyway.

**Residual:** a window before detection. Rings and the kill-switch bound it.

### A6 — Compromised patch-signing key

**Goal:** mutate every customer's data at once.

**Mitigations:** key held **offline/cold**, ceremony with quorum approval and both signatures; typed operations only; target allow-list limited to the module's own tables; `events`, `audit_entries`, `command_log` and other platform tables structurally unreachable; row caps; mandatory dry run; rings 5 → 25 → 100 with automatic gates; **pre-signed kill-switch**; post-commit restore (ADR-015).

**Residual:** a correctly-signed, allow-listed, in-cap patch can still be semantically wrong. Dry-run expectations, rings and restore are the defence, not perfection.

### A7 — Compromised app-updater signing key

**Goal:** push a malicious app update to every Admin PC.

**Mitigations:** key held **offline / cold**; quorum approval for use (ADR-013 `approvals_required` setting); rotated by an update signed by **both** old and new keys, so clients trust the transition; listed in the key hierarchy (ADR-022) and here.

**Residual:** if compromised, an attacker gets code execution on every Admin PC — worse blast radius than a bad patch key. This is why the key is offline, quorum-gated, and rotated carefully.

### A8 — Malicious or buggy module / module UI

**Goal:** read another module's data, exfiltrate, escape.

**Mitigations:** WASI capability grants; `mod_<name>_*` table isolation; no raw DB handle; **structured filters, never raw SQL**; UI in an opaque-origin iframe with nonce CSP and `connect-src 'none'`; allow-listed, schema-validated bridge with per-load session tokens and `event.source` checks; CPU/memory/message limits (ADR-006, ADR-011).

**Residual:** host API bugs. Fuzzing and review are mandatory line items.

### A9 — Network attacker (MITM, replay, malicious relay)

**Goal:** read or alter sync traffic; impersonate the Admin.

**Mitigations:** WireGuard E2E with peer authentication by public key; certificates verified in both directions; timestamps ±60 s and 5-minute nonce cache on discovery; Admin device signatures on batches and snapshots; relay holds no keys.

**Residual:** traffic analysis (sizes, timing) and denial of service by dropping packets.

### A10 — Curious or compromised platform insider

**Goal:** read customer data or metadata without cause.

**Mitigations:** no business data in the Cloud; metadata-only Console; **staff reads are audited and visible to the customer**; hardware-key staff auth; quorum for publish/patch/escrow; customer-consented, scoped diagnostics only (ADR-013).

**Residual:** assisted-mode escrow release is possible with quorum approval after 48 h — but it alerts the customer and is permanently recorded. Zero-knowledge removes the path entirely. **At quorum 1 (solo deployment) a single compromised insider can approve an escrow release after the 24 h delay and 48 h wait.** The customer alert and the audit chain still apply. This is disclosed (ADR-013 §3 item 7).

### A11 — Supply chain (crates, npm, build)

**Goal:** inject code into a shipped binary or the Cloud.

**Mitigations:** locked dependencies, `cargo deny`, review of new deps, pinned toolchains verified at Phase 0, reproducible builds where feasible, signed releases, three-repo separation so a product-repo compromise cannot reach Cloud secrets (ADR-001).

**Residual:** a compromised upstream crate with wide adoption. Mitigated by pinning and review, not eliminated.

### A12 — Resource exhaustion / DoS

**Goal:** hang the Admin, flood discovery, exhaust relay bandwidth.

**Mitigations:** the limits table in Principle 13 and SYNC-PROTOCOL §13; discovery rate limits per device and per pair; relay session tokens, metering and expiry; module CPU/memory caps.

**Residual:** volumetric network DoS against the Cloud. Standard infrastructure mitigation, not application logic.

### A13 — Data loss (disk failure, ransomware, accidental deletion)

**Goal:** none — this is the availability threat.

**Mitigations:** per-plan encrypted backups; pre-migration and pre-patch snapshots; corbeille with a defined quota; 30-day support-assisted recovery from pre-deletion backups; erasure ledger re-applied on restore; headless Admin option (ADR-005, ADR-008, ADR-015, ADR-016, ADR-022).

**Residual:** Plan 1 has no Cloud backup by design; local backup is the customer's routine. Zero-knowledge with a lost code is unrecoverable — disclosed repeatedly.

### A14 — Clock tampering

**Goal:** extend a licence or module binding indefinitely.

**Mitigations:** monotonic anchor + `last_seen_cloud_time`; `trusted_now = max(...)`; rollback detected and ignored; anchor tamper → read-only immediately until Cloud contact (fail-closed) (ADR-014). **The anchor lives in device-level `admin_state.db`, not `project.db`**, so a backup restore cannot roll it back. `state_revision` is mirrored in the OS keychain; a rolled-back or deleted `admin_state.db` ⇒ read-only; a new device is read-only until first Cloud contact and is seeded from signed Cloud time only (ADR-014 §3).

**Residual:** bounded — the Cloud will not sign past expiry regardless of the local clock.

### A15 — Erasure vs immutable history

**Goal (regulatory, not adversarial):** honour an erasure request without breaking the audit chain.

**Mitigations:** crypto-shredding of per-resource keys; blind-index deletion; permanent metadata-only `erasure_ledger`; **ledger re-applied on every restore**; projection-cache snapshots deleted on erasure; disclosed residual backup window (ADR-016).

**Residual:** ciphertext persists in old backups until retention removes it, and the ledger guarantees it stays unreadable. We state this rather than claiming instant global erasure.

### A16 — Malware running as the customer's OS user

**Goal:** read project data or keys from a running or idle Admin PC.

**Reality:** the app password is an **app-UI lock**, not a key. The Project Master Key and device keys sit in the OS keychain, which any process running as the same OS user can usually read. Guessing the password cannot reach the keys (no key is derived from it), but code running as the user can.

**Mitigations:** SQLCipher at rest (protects a copied disk or backup), keys non-exportable where the platform allows, signed and hardened binaries, audit chain detects in-app tampering.

**Residual:** a compromised OS user session can read what that user can read. Full-disk encryption, OS updates and endpoint protection are the customer's responsibility and are stated in onboarding. Later hardening (not in v1-foodlab): bind a keychain-held secret and the password into one wrapping key, or require Windows Hello / Touch ID per unlock.

---

## 4. Explicit non-goals

- Absolute DRM against a device owner with full control.
- Protection against a compromised OS kernel or hypervisor on the customer machine.
- Hiding contact intent from our own discovery service.
- Defending a customer who disables their OS disk encryption and shares their account password.

Stating non-goals is part of the model. A threat model that claims everything protects nothing.

---

## 5. Security testing programme

| Activity | When | Owner |
|---|---|---|
| Dependency audit (`cargo deny`, npm audit) | Every CI run | product / cloud |
| Architecture lint suite (Principles enforcement) | Every CI run | all |
| Fuzzing: frame parser, patch compiler, bridge dispatcher, manifest parser, module migration parser, RowOp validator | Nightly | core |
| Chaos: kill mid-write, mid-patch, mid-snapshot; disk full; partition | Weekly | core |
| Recovery abuse-case drill (takeover + social engineering) | Before launch, then quarterly | security |
| External penetration test | Before public launch, then annually | contracted |
| Owner audit-chain review | Weekly | owner |
| Access review (staff, ops VPN, HSM) | Quarterly | ops |

---

## 6. Open items

- Full STRIDE decomposition per public endpoint.
- Formal review of the patch compiler's allow-list (highest-value target).
- Relay abuse and metering policy under sustained attack.
- Written incident-response runbook with customer-notification timelines.
- App-updater key rotation drill (verify dual-signature transition works end-to-end).