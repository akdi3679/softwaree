# ADR-007: Triple-Signed Modules

**Status:** Accepted
**Date:** 2026-07-26
**Deciders:** Architecture team

---

## Context

Modules (medical-reception, food-lab, future verticals) are downloaded by the Admin, then distributed to the User. They handle regulated data (medical records, lab results). We must prevent:

- A module from being copied to a different project
- A module from being copied to a different device (Admin or User)
- A module from being modified after signing
- A module from being installed on a plan that doesn't allow it
- A module from being installed on a project that's not active

The user said: *"modules should have relation with cloud, project, admin and user if there and the plan and the billing and authentication — never depasse them all required."*

## Decision

**Every module package carries three signatures**, each enforced at install time and at every load time.
Signed bundle structure:
┌────────────────────────────────────────────┐
│ manifest.json (plaintext) │
│ module_id, version, required_core, etc. │
│ manifest.sig.cloud_root │ ← signed by platform-cloud root key
│ manifest.sig.project_license │ ← signed by per-project license key
│ manifest.sig.device_bind │ ← bound to specific target device (Admin or User)
│ binary.wasm (the module code) │
│ binary.sha256 │
│ binary.sig.cloud_root │ ← signed by platform-cloud root key
│ binary.sig.project_license │ ← signed by per-project license key
│ binary.sig.device_bind │ ← bound to specific target device (Admin or User)
└────────────────────────────────────────────┘



All three signatures must verify before the module can be:
1. Installed on the Admin or User
2. Loaded into the Wasmtime runtime
3. Distributed from Admin to User (when applicable)

If any signature is invalid, the module is rejected. No exceptions. No admin override. (Recovery is "re-download from Cloud with fresh signatures.")

## What each signature proves

### `cloud_root`

Signed by the platform-cloud's root signing key. This key is held in a hardware security module (HSM) in production, or in an encrypted key file in dev. Proves:
- "This module was published by us, the platform vendor."
- "The binary has not been modified since we signed it."

### `project_license`

Signed by the **per-project** license key. The Cloud generates this key when a project licenses a module. Proves:
- "This specific project is allowed to use this module."
- "The project's plan allows this module."
- "The license is not expired."

### `device_bind`

Signed using a key derived from the **specific target device's** key (Admin device or User device). The target device must prove it owns the device by signing a challenge with its private key. The Cloud then signs the module bundle with a key that's bound to that device's identity. Proves:
- "This module is bound to this specific device."
- "The device is the one that licensed this module (Admin) or is authorized to run it (User)."

## Consequences

### Positive

- **Cannot copy a module to another project.** The `project_license` signature is per-project. Copying the file to another project fails verification.
- **Cannot copy a module to another device.** The `device_bind` signature is per-device. The same physical module binary, copied byte-for-byte to another machine, fails verification.
- **Cannot modify the binary.** Both manifest and binary are signed. Any change breaks `cloud_root` signature.
- **Cannot use on a project that doesn't have the right plan.** `project_license` signature is only generated if the plan check passes.
- **Cannot use on a non-active project.** License signature is only generated for `ACTIVE` projects.
- **Cannot bypass by replaying old bundles.** Signatures are bound to module version. A bundle for v1.0 cannot be used to satisfy a v1.1 license.
- **Self-revoking.** When a project is suspended or a device replaced, the Cloud can revoke the current signatures by simply not renewing them. Old bundles become inert on next verification.

### Negative

- **Module install requires Cloud roundtrip.** The Admin must contact the Cloud to get a signed bundle. We accept this — module install is a rare operation, not a per-request operation.
- **Admin device replacement requires re-signing all modules.** Acceptable — this is a deliberate, infrequent operation.
- **User device replacement also requires re-signing modules bound to that user.** Acceptable — same as Admin, rare.
- **Project license change (upgrade/downgrade plan) requires re-signing.** Acceptable — also rare.
- **Key management complexity.** We need to manage:
  - Cloud root key (HSM in prod)
  - Per-project license keys
  - Per-device binding keys (for both Admin and User devices)
  - Per-module-version manifest signing

  All managed inside `platform-cloud/`. The Admin and User never see private keys.

### Neutral

- The signing format is `ed25519` for speed and small signatures. Public keys are embedded in the bundle.
- Verification is fast — microseconds per signature check.

## Verification Flow

### At install time (Admin downloads module from Cloud)
Admin: GET /v1/modules/{id}/versions/{v}/package

Authorization: signed JWT proving device identity

Response: signed bundle (HTTPS, additional application-level signature)

Admin receives bundle

Admin verifies cloud_root signature against embedded public key

On fail: REJECT, log security event, notify Cloud

Admin verifies project_license signature

Requires fetching project's public key from Cloud (or cached)

On fail: REJECT, log

Admin verifies device_bind signature

Requires device's own private key to verify (it's a MAC, not a public-key sig)

On fail: REJECT

Admin computes SHA-256 of binary, compares to manifest.sha256

On fail: REJECT

Admin stores bundle in projects/{id}/modules/{module}-{version}.wasm

Admin registers module in module_registry table with all verification timestamps



### At load time (Wasmtime instantiates module on Admin)
Host loads bundle from disk

Host re-verifies all three signatures (cheap, microseconds)

Host checks module_registry: is this module still licensed to this project?

Host checks: is the device still the active admin device?

If all pass: instantiate Wasmtime module with capability grants

If any fail: refuse to load, log security event



The "re-verify at load time" is important. A bundle that was valid at install time may have been revoked since (project suspended, device replaced, plan changed).

### User app module delivery and verification

When a user logs in and the Admin determines the user should run a module, the Cloud issues a **user-bound module bundle** for that specific user device. The flow:

1. User requests module access (or Admin pushes module assignment to user)
2. Cloud verifies:
   - User is member of project
   - Project license allows this module
   - User has permission to run this module (defined by Admin)
   - User device is active
3. Cloud signs a bundle for the User device:
   - `cloud_root` signature (module vendor)
   - `project_license` signature (project is licensed)
   - `device_bind` signature (bound to that specific User device)
4. User downloads or receives the bundle (via Admin or directly from Cloud)
5. User verifies all three signatures before loading in Wasmtime
6. At load time, User re-verifies signatures and module registry state

The User's module runtime grants are **restricted**:
- Read access to user's authorized projection only
- Submit commands to Admin (via the standard command handshake)
- No direct DB writes
- No audit log access
- No module management actions

## What the User app sees (updated)

The User app **also runs modules and verifies the same three signatures**. It does not rely solely on Admin's verification. Each user receives a bundle signed specifically for their device. The User app verifies:

- `cloud_root` signature (module vendor)
- `project_license` signature (project is licensed)
- `device_bind` signature (bound to this specific User device)

This prevents a module from being copied between user devices or from being executed without a valid user license.

## Key Rotation

- **Cloud root key:** rotated annually. Old key still verifiable for backwards compatibility (modules signed by old key remain valid). New key signs new modules. Both keys embedded in Admin clients (or fetched from Cloud on first run).
- **Per-project license key:** rotated on plan change, project suspension/resumption, or scheduled (every 90 days).
- **Per-device binding key:** rotated on device replacement, or scheduled (every 30 days).
- **Module version signing:** each module version has its own manifest signature. New version = new signature. Old versions remain valid until explicitly revoked.

## Alternatives Considered

### Cloud signature only (one signature)

**Pros:** simpler.
**Cons:** module can be copied between projects, between devices, between customers.
**Rejected because:** the user explicitly requires binding to project + device + plan.

### Cloud + project signature (two signatures, no device bind)

**Pros:** still prevents project-to-project copying.
**Cons:** the same Admin can install the module on multiple physical machines (laptop + desktop). For some threat models, that's fine. For ours, no.
**Rejected because:** the user wants device binding too.

### Symmetric encryption (single shared key)

**Pros:** simplest, fastest.
**Cons:** key distribution is hell; revoking a single device requires re-encrypting everything.
**Rejected because:** asymmetric is the right tool for this.

### Trusted Platform Module (TPM) on Admin

**Pros:** strongest possible device binding.
**Cons:** not all customer devices have TPMs; macOS TPM is locked down; Linux TPM is patchy; cross-platform is a nightmare.
**Rejected for v1.** We can add TPM as an additional factor in v2 without breaking the model.

## Enforcement

- The Cloud's signing service is a separate, isolated process. Only the module registry can call it. The signing key is never loaded into the main API process.
- A linter rule in `platform-cloud/`: no module can be marked `ACTIVE` in the registry without all three signatures present and valid.
- A linter rule in `product/`: no Wasmtime instantiation code can skip the verification step. The verification function is the only path to `wasmtime::Module::new`.
- The Admin's security log records every verification attempt, success or failure, with the device's project, the module's id+version, and the verification result. This log is uploaded to Cloud daily.
- The User app also records verification attempts locally, and these logs are sent to Admin as part of normal audit flow.