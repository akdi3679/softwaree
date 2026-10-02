# Module Publisher Guide

> **Status:** Active
> **Audience:** the platform owner/operator (us), not external publishers
> **v1 scope:** no third-party publishers. All modules are ours.

For v1, the marketplace is closed. Only the platform owner publishes
modules. This document describes the internal flow.

---

## 1. What a module is

A module is a WASM artifact (Rust compiled to `wasm32-wasip2`) that runs
inside the Admin app (full power) and the User app (restricted). It
declares its capabilities in a manifest. It cannot escape its sandbox.

Every module has:

- A unique `module_id` (lowercase, alphanumeric + underscore).
- A semver `version` (e.g. `1.2.3`).
- A signed package (`<module_id>-<version>.wasm` + manifest + signatures).
- A category (`medical`, `food-lab`, `retail`, `service`, `industrial`,
  `other`).
- A `min_plan` (`local`, `starter`, `team`, `enterprise`).

---

## 2. The publish flow

    1. Build      -> cargo build --target wasm32-wasip2 --release
    2. Hash       -> sha256 of the .wasm binary
    3. Sign       -> Cloud root key signs the manifest + binary
    4. Package    -> tar with manifest.json + signatures.json + binary
    5. Upload     -> POST /v1/marketplace/modules (JSON body, base64 binary)
    6. Review     -> automated checks + manual review
    7. Publish    -> review_status = "published", is_listed = true
    8. License    -> per-project license is issued at install time

The publish code is in `platform-cloud/apps/api/src/marketplace/publisher.ts`.

---

## 3. Signing keys

Three keys are involved (see ADR-007):

| Key | Where | Purpose |
|---|---|---|
| Cloud root key | HSM / offline, accessed by `module-signing.ts` | Sign the module package |
| Project license key | Cloud (per project) | Sign the install-time license |
| Device bind key | Device-local | HMAC the module to a device |

**Rule:** the Cloud root key is never in the same process as the main
API. The signing service is separate and only callable via the private
channel (`/ops/*`).

**Rule:** every signing operation is audited with the module_id,
version, actor, and target project.

---

## 4. What gets signed

The cloud_root signature covers:

    module_id
    name
    version
    description
    binary_format
    binary_size_bytes
    sha256
    capabilities
    provided_commands
    provided_events
    provided_queries
    min_core_version
    min_app_version
    signed_at

Any change to any of these fields invalidates the signature.

---

## 5. Automated checks (before review)

Runs at upload time, in `marketplace/publisher.ts`:

- Manifest schema valid (via Zod).
- `module_id` matches `^[a-z0-9_-]+$`.
- `version` matches semver.
- `sha256` in the manifest matches the actual binary hash.
- `capabilities` list is a subset of the allowed set.
- `binary_format` is `wasm32-wasip2` or `wasm`.

Failing any of these rejects the upload immediately. No human involved.

---

## 6. Manual review (before publish)

For v1, this is us. Checklist (`docs/marketplace/REVIEW-CHECKLIST.md`):

- Capabilities are the minimum necessary.
- No `NetworkEgress` unless the module truly needs it.
- No `FilesystemWrite` unless the module truly needs it.
- No `SpawnSubprocess` unless the module truly needs it.
- Table prefix isolation respected (all tables start with
  `mod_<name>_`).
- No direct access to audit tables.
- No direct access to key material.
- Test coverage exists (see Section 7).

---

## 7. Test requirements

A module must ship with:

- At least one test per command.
- At least one test per query.
- One concurrency test (idempotency under repeated invocation).
- A smoke test that loads the module into Wasmtime and executes one
  command end-to-end.

All in the module's own crate under `tests/`.

---

## 8. Versioning

- **Patch** (1.2.3 -> 1.2.4): bug fixes. No manifest schema changes. Can
  ship without re-review.
- **Minor** (1.2.3 -> 1.3.0): new commands or queries. Requires review.
- **Major** (1.2.3 -> 2.0.0): breaking changes (removed commands,
  renamed fields). Requires review AND a migration plan for existing
  installs.

Every major version change requires an ADR.

---

## 9. Deprecation

Deprecating a module version:

- Mark `deprecated_at` on the module_versions row.
- Existing installations continue to work.
- New installations cannot pick a deprecated version.
- Admin apps receive a "please upgrade" notice at next connect.

Deprecating a whole module:

- Mark `is_listed = false`.
- Existing installations continue to work.
- New installations blocked.

---

## 10. Installation (what happens on the customer side)

    1. Customer selects a module in the Admin app.
    2. Admin asks the Cloud for the module manifest + signed package.
    3. Cloud issues a project license signature (binds module_id +
       version + project_id + plan_id).
    4. Cloud returns the package + license.
    5. Admin verifies all three signatures (root, license, device bind).
    6. Admin stores the package under modules_dir and records the license.
    7. Admin instantiates the module in Wasmtime with declared capabilities.
    8. Every load, command, and query is audited.

The install code is in `apps/admin/src-tauri/src/modules/installer.rs`.

---

## 11. Revoking a module

If a module is found to be compromised:

1. Mark the module_version `review_status = 'revoked'` and set
   `review_reason`.
2. Push a critical update to all Admins: kill the module, invalidate
   its license, require re-install of a safe version.
3. If the module is ours, patch and republish.
4. Audit the revocation event.

The critical update is delivered through the live-heart update
mechanism (see ADR-010 / 01-PRINCIPLES rule 10).

---

## 12. What we will NOT allow (even from ourselves)

- A module that reads another module's tables.
- A module that touches the audit log.
- A module that phones home to an external server.
- A module that writes to a user's home directory outside `modules_dir`.
- A module that spawns subprocesses.
- A module that takes more than 5 seconds of CPU per invocation.
- A module that uses more than 64 MB of memory per instance.

Any of these requires an ADR and a formal review.

---

## 13. Future: third-party publishers

Not in v1. When we do open it (v2.0 at earliest), the flow will add:

- Publisher onboarding (account + verified identity).
- Publisher signing keys (per publisher, not just ours).
- Trust levels (verified publisher vs unverified).
- Revenue share.
- Automated malware scanning.
- Sandboxed trial runs.
- A formal publisher ToS.

None of this is built. It is a v2 conversation.