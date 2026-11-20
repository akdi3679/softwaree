# ADR-007: Triple-Signed Modules (Manifest Signatures + Encrypted Content)

**Status:** Accepted — amended 2026-11-20
**Date:** 2026-07-26
**Amended:** 2026-11-20 — signatures on the manifest only, encrypted module content, certificate chain to an embedded root, explicit licence expiry, `device_bind` defined exactly once
**Deciders:** Architecture team
**See also:** ADR-006 (runtime), ADR-011 (bundle + UI contract), ADR-012 (permissions), ADR-014 (licensing), ADR-022 (key custody), ADR-023 (offline bootstrap)

---

## Context

Modules (medical-reception, food-lab, future verticals) are downloaded by the Admin, then distributed to User devices. They handle regulated data (medical records, lab results). We must prevent:

- A module from being copied to a different project
- A module from being copied to a different device (Admin or User)
- A module from being modified after signing
- A module from being installed on a plan that does not allow it
- A module from being installed on a project that is not active
- A module from running forever after a licence ends

The user said: *"modules should have relation with cloud, project, admin and user if there and the plan and the billing and authentication — never depasse them all required."*

This is the payment gate. It must be enforceable by cryptography, not by an `if` statement in the client.

---

## Decision

**Every module bundle carries three signatures on its manifest, and its logic is encrypted to the target device.**

Five rules:

1. **Only the manifest is signed.** The manifest contains the hash of the module binary and the hashes of every UI asset. Signing the binary separately three times is redundant — one signature over a hash is exactly as strong as a signature over the bytes, and it is cheaper and simpler.
2. **The logic is encrypted, not just signed.** `binary.wasm` is encrypted with a random per-bundle **Content Key**. That Content Key is wrapped to the target device's **X25519 public key** and stored in the manifest (`content_key_slot`). A copied file is useless on another machine *even if a patched client skips every signature check*.
3. **The trust anchor is embedded in the app.** The Cloud root public key ships inside the signed app binary. The per-project licence key is verified through a **certificate chain** that terminates at that embedded root. A bare public key fetched from the Cloud at runtime is **not** a trust anchor and must never be treated as one.
4. **Every binding expires.** `license_expiry` is part of the signed material. "Revoke by not renewing" only works if there is an expiry to reach.
5. **`device_bind` is a signature, never a MAC.** Defined once, below. No shared secret between Cloud and device exists.

### Bundle layout

```
bundle/
├── manifest.json                  ← plaintext, canonicalised with JCS (RFC 8785)
├── manifest.sig.cloud_root        ← Ed25519, Cloud root key (HSM)
├── manifest.sig.project_license   ← Ed25519, per-project licence key
├── manifest.sig.device_bind       ← Ed25519, Cloud signing service
├── cert_chain.pem                 ← project licence cert → intermediate → Cloud root
├── binary.wasm.enc                ← AES-256-GCM encrypted module logic
└── ui/                            ← signed static UI assets (ADR-011)
    ├── index.html
    ├── module.js
    └── module.css
```

### Manifest fields

| Field | Meaning |
|---|---|
| `module_id` | Stable module identifier, e.g. `medical-reception` |
| `module_version` | Semver of this module build |
| `api_version` | Host API version this module was compiled against (ADR-011) |
| `required_core_min` | Minimum Admin/User core version |
| `binary_sha256` | SHA-256 of the **plaintext** `.wasm` (identical across devices) |
| `ciphertext_sha256` | SHA-256 of `binary.wasm.enc` **as delivered to this device** |
| `ui_sha256` | Map of `ui/<path>` → SHA-256 of that asset |
| `content_key_slot` | Content Key wrapped to this device's X25519 public key |
| `device_pubkey` | The target device's Ed25519 public key (base32) |
| `project_id` | The project this bundle is licensed to |
| `license_id` | Cloud licence record this bundle was issued under |
| `license_expiry` | RFC 3339 timestamp. `null` only for a Plan 1 perpetual local licence |
| `issued_at` | RFC 3339 timestamp of issuance |
| `capabilities` | WASI grants + host functions this module may import |
| `tables` | Table prefixes this module owns (`mod_<name>_*`) |

**Bundle hash (the thing all three signatures sign):**

```
bundle_hash = SHA-256( "platform.bundle.v1" || JCS(manifest without the signatures field) )
```

JCS is RFC 8785 canonical JSON. The same rule and the same domain-tag style are used by the audit chain (Principle 11), so there is one canonicalisation implementation in the codebase.

---

## What each signature proves

### 1. `cloud_root`

Ed25519 signature over `bundle_hash`, made by the platform Cloud's **root signing key** (HSM in production, encrypted key file in dev).

Proves:
- "This module was published by us, the platform vendor."
- "The manifest — and therefore the binary hash and every UI hash — has not been modified since we signed it."

Verified with the root public key **embedded in the app binary**.

### 2. `project_license`

Ed25519 signature over `bundle_hash`, made by the **per-project licence key**. The Cloud generates that key when a project licenses a module. Its certificate is included in `cert_chain.pem` and chains to the embedded Cloud root.

Proves:
- "This specific project is allowed to use this module."
- "The project's plan allows this module."
- "The project was ACTIVE and in good standing at issuance."

The certificate carries its own validity window and is checked against the monotonic clock anchor (ADR-014).

### 3. `device_bind`

**One definition, used everywhere in this document set:**

```
device_bind = Ed25519_Sign(
  CloudSigningKey,
  "platform.bind.v1" || JCS({
    bundle_hash,
    device_pubkey,
    project_id,
    license_expiry
  })
)
```

At issuance the device proves ownership of its identity by signing a Cloud challenge with its Ed25519 private key. The Cloud then signs the tuple above.

At verification the device:
1. Verifies the signature with the Cloud public key (embedded root, or a delegated signing certificate that chains to it).
2. Checks that `device_pubkey` inside the signed tuple **equals its own public key**.
3. Checks that `license_expiry` is in the future (or `null` for a Plan 1 perpetual local licence).

It is a **public-key signature**. The device needs no secret shared with the Cloud, and no private key other than its own to prove identity. There is no MAC anywhere in this design.

Proves:
- "This bundle is bound to this specific device."
- "This device was the one the Cloud issued the licence to."
- "This binding has a defined end date."

---

## Verification flow

### At install time (Admin or User receives a bundle)

```
1. Parse manifest.json; recompute bundle_hash from JCS(manifest minus signatures)
   Mismatch → REJECT
2. Verify cloud_root signature over bundle_hash with the EMBEDDED Cloud root key
   Fail → REJECT, log security event, notify Cloud
3. Verify cert_chain.pem terminates at the embedded Cloud root
   Verify the project licence certificate is within its validity window
   Fail → REJECT, log
4. Verify project_license signature over bundle_hash with the certified project key
   Fail → REJECT, log
5. Verify device_bind signature over the bind tuple
   Check signed device_pubkey == this device's own public key
   Check license_expiry is in the future (monotonic clock anchor, ADR-014)
   Fail → REJECT, log
6. Compute SHA-256 of binary.wasm.enc; compare to manifest.ciphertext_sha256
   Fail → REJECT
7. Unwrap content_key_slot with this device's X25519 private key; decrypt binary
   Compute SHA-256 of the plaintext; compare to manifest.binary_sha256
   Fail → REJECT
8. Verify every ui/ asset hash against manifest.ui_sha256
   Fail → REJECT
9. Check manifest.api_version is supported by this host (ADR-011)
   Unsupported → do not install; show a clear "module needs a newer app" message
10. Store bundle under projects/{id}/modules/{module}-{version}/
11. Register in module_registry with all verification timestamps
```

### At load time (every Wasmtime instantiation)

```
1. Re-verify all three signatures (microseconds)
2. Re-check certificate validity and license_expiry against the clock anchor
3. Re-check module_registry: still licensed to this project?
4. Re-check device state: is this still the active Admin (or an active member)?
5. Re-check the member's module-access list (ADR-012)
6. Re-verify binary and UI hashes
7. All pass → instantiate with the manifest's capability grants
   Any fail → refuse to load, log a security event, show a plain-language reason
```

Re-verification at load time is mandatory. A bundle valid at install time may have expired or been revoked since.

### User-device delivery

1. Admin assigns module access to a member, or the member requests access.
2. Cloud verifies:
   - Account is a member of the project
   - Project licence permits this module
   - The member's **module-access list** includes this module. This list is synced from the Admin at assignment time. The Cloud checks this coarse entitlement only — it never holds the per-role permission list (ADR-012).
   - Device is ACTIVE
3. Cloud issues a bundle bound to that User device (same three signatures, content key wrapped to that device's X25519 key).
4. User receives it via the Admin or directly from the Cloud.
5. User runs the **full** verification flow above. It never relies on the Admin having checked.
6. User re-verifies at every load.

The User's runtime grants are restricted:
- Read access to its own authorised projection only
- Submit commands to the Admin (one-round-trip path, ADR-012 / SYNC-PROTOCOL)
- No direct database writes
- No audit-log access
- No module-management actions

---

## Bootstrap bundles (Plan 1 and offline first run)

Plan 1 is local-only and may be created with no internet. To avoid a chicken-and-egg problem, the app ships with the two standard modules **embedded** as **bootstrap bundles**:

- Signed by `cloud_root` only. No `project_license`, no `device_bind`.
- Verified against the embedded root and the app's own code signature.
- Valid for a **30-day bootstrap grace** from first launch, tracked by the monotonic clock anchor.
- Grant the standard module set only. Never custom modules. Never User devices.
- Every use is logged locally.

After the grace period, if the project has never been activated, the app becomes **read-only**. Reading and exporting existing data always remain available (Principle 14). One free online activation converts the project to a normal Plan 1 perpetual licence and issues fully bound bundles. See ADR-023.

This is the only exception to "three signatures, no exceptions", it is time-boxed, and it cannot be used to run a paid module.

---

## Consequences

### Positive
- **Cannot copy a module to another project.** `project_license` is per-project.
- **Cannot copy a module to another device.** `device_bind` names the device public key, and the content is encrypted to that device's X25519 key. A byte-for-byte copy fails both the signature check and decryption.
- **Cannot modify the binary or the UI.** Hashes are inside the signed manifest.
- **Cannot use a module the plan does not allow.** The licence signature is only issued after the plan check.
- **Cannot use a module on a non-active project.** Licence signatures are only issued for ACTIVE projects.
- **Cannot replay an old bundle for a new licence.** `license_id`, `module_version` and `bundle_hash` are all signed.
- **Actually self-revoking.** Bindings expire (default 30 days). Stop renewing and the bundle becomes inert at the next load-time check.
- **One canonicalisation, one hash rule** shared with the audit chain.

### Negative
- **Install requires a Cloud round trip.** Accepted — installation is rare, not per-request.
- **Admin device replacement re-issues every bundle.** Accepted — deliberate and infrequent.
- **User device replacement re-issues that user's bundles.** Accepted.
- **Plan change re-issues licences.** Accepted.
- **Key management complexity.** We must manage:
  - Cloud root key (HSM in production)
  - Cloud signing service key (delegated, chains to root)
  - Per-project licence keys + certificates
  - Device binding tuples (bundle hash + device pubkey + expiry) — **not** per-device signing keys
  - Per-bundle Content Keys
  All Cloud-side keys live in `platform-cloud/`. The Admin and User never see Cloud or project-licence private keys; they hold only their own device keypairs.
- **Not absolute DRM.** See below.

### Neutral
- Signature algorithm is Ed25519 throughout. Content encryption is AES-256-GCM. Key wrapping uses X25519 + HKDF + AES-256-GCM.
- Verification is microseconds per signature; decryption of a typical module is single-digit milliseconds.
- Bundles are per-device, so the Cloud stores one encrypted artifact per (module version, device). Content Keys are generated per bundle.

### Honest limit

The client runs on the customer's machine. Signatures, encryption, sandboxing and load-time re-checks raise the bar substantially — a copied file is inert, and a patched client still cannot decrypt content it has no key for. But a determined attacker with full control of a device that legitimately holds a licence can extract what that device can read. **This is a strong licensing gate, not unbreakable DRM.** We state this plainly in the docs and never claim otherwise in marketing.

---

## Key rotation

| Key | Rotation | Notes |
|---|---|---|
| Cloud root | Annually | Old root stays embedded for one full app release cycle so existing bundles keep verifying. New root ships in an app update before it is used to sign. |
| Cloud signing service | Every 90 days | Delegated certificate chaining to root. Compromise is contained by revoking the certificate. |
| Per-project licence key | On plan change, suspension/resumption, or every 90 days | Certificate validity matches. |
| Device binding | Not a key — an expiring signature (default 30 days) | Re-issued on licence refresh. Device replacement invalidates the old pubkey, so old bindings fail the pubkey check. |
| Content Key | Per bundle | Never reused across devices or versions. |
| Module version | New version = new manifest = new signatures | Old versions remain valid until explicitly revoked or expired. |

Root rotation never requires re-signing every historical bundle: the overlap window plus load-time expiry checks bound the exposure.

---

## Alternatives Considered

### Cloud signature only
**Pros:** simplest. **Cons:** modules copy freely between projects, devices and customers. **Rejected:** the user explicitly requires project + device + plan binding.

### Cloud + project signatures, no device binding
**Pros:** stops project-to-project copying. **Cons:** one licence runs on every machine the customer owns. **Rejected:** device binding is required.

### Sign the manifest AND the binary, three times each
**Pros:** feels thorough. **Cons:** the manifest already contains the binary hash, so the extra six signatures add zero security, double the failure modes, and complicate rotation. **Rejected as redundant.**

### `device_bind` as a MAC over a device-derived key
**Pros:** cheap. **Cons:** requires a shared secret between Cloud and device; a signing key cannot be used for key derivation; verification would need the very secret we are trying to protect. **Rejected:** it is a signature.

### Fetching the project public key from the Cloud at verification time
**Pros:** no certificate infrastructure. **Cons:** the Cloud is not a trust anchor for its own claim — a compromised or spoofed endpoint substitutes its own key. **Rejected:** certificate chain to the embedded root.

### Symmetric encryption with a single shared key
**Pros:** fast. **Cons:** revoking one device means re-encrypting everything. **Rejected.**

### TPM-only binding
**Pros:** strongest hardware binding. **Cons:** not every customer device has a usable TPM; cross-platform support is uneven. **Rejected for v1.** Can be added as an extra factor in v2 without changing the model.

---

## Enforcement

- The Cloud signing service is a separate, isolated process. Only the module registry can call it. Signing keys are never loaded into the main API process.
- Lint rule in `platform-cloud/`: no module version can be marked `ACTIVE` without all three signatures present and valid.
- Lint rule in `product/`: the verification function is the only path to `wasmtime::Module::new`. No bypass, including in tests and dev tools.
- Lint rule: no code may treat a runtime-fetched public key as a trust anchor. Only the embedded root and certificates chaining to it.
- Every verification attempt (success or failure) is written to the Admin's security log with project, module id + version, device, and result. Batched to the Cloud daily. User devices report to the Admin as part of normal audit flow.
- The clock used for expiry checks is the monotonic anchor (ADR-014), never the raw wall clock.

### Tests
- [ ] Tampered manifest → rejected
- [ ] Tampered ciphertext → rejected before decryption
- [ ] Tampered UI asset → rejected
- [ ] Bundle copied to a second device → `device_bind` pubkey check fails AND decryption fails
- [ ] Bundle copied to a second project → `project_license` fails
- [ ] Certificate not chaining to the embedded root → rejected
- [ ] Expired `license_expiry` → refused at load time
- [ ] Clock rolled backwards → expiry still enforced via the monotonic anchor
- [ ] Suspended project → refresh refused, bundle expires, load refused
- [ ] Unsupported `api_version` → clean "update the app" message, never a crash
- [ ] Bootstrap bundle after 30 days → read-only, export still works