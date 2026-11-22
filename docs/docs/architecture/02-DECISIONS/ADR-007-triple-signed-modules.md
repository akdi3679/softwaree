# ADR-007: Triple-Signed Modules (Manifest Signatures + Encrypted Content)

**Status:** Accepted — amended 2026-11-20 (review pass 2)
**Date:** 2026-07-26
**Amended:** manifest split into module + binding sections; signing hierarchy
clarified; field names unified; missing manifest fields added
**Deciders:** Architecture team
**See also:** ADR-006 (runtime + contract), ADR-011 (bundle + UI),
ADR-012 (permissions), ADR-014 (licensing), ADR-022 (keys)

---

## Context

Modules are downloaded by the Admin, then distributed to User devices.
They handle regulated data. We must prevent:

- Copying a module to a different project or device
- Modifying a module after signing
- Installing a module on a plan that does not allow it
- Installing a module on a non-active project
- Running a module forever after a licence ends

## Decision

**Every module bundle carries three signatures on its manifest, and its
logic is encrypted to the target device.**

The manifest is split into **two sections** with different signing
frequencies. This is the critical design decision:

### The module section (signed ONCE at publish)

The module section is **identical for every device**. It is signed by
`cloud_root` once, during the quorum publish ceremony (ADR-013).
Renewal does NOT re-sign it.

```json
{
  "module_id": "food-lab",
  "module_version": "1.0.0",
  "api_version": 1,
  "required_core_min": "1.0.0",
  "binary_sha256": "<SHA-256 of plaintext binary.wasm>",
  "ui_sha256": {
    "ui/index.html": "<SHA-256>",
    "ui/module.js": "<SHA-256>",
    "ui/module.css": "<SHA-256>"
  },
  "migrations_sha256": {
    "migrations/001.sql": "<SHA-256>"
  },
  "tables": [
    "mod_food_lab_settings",
    "..."
  ],
  "commands": [
    {
      "name": "create_sample",
      "permission": "food-lab.sample.create",
      "writes": [
        "mod_food_lab_samples"
      ],
      "events": [
        "sample.created"
      ],
      "offline_policy": "ADMIN_REQUIRED"
    }
  ],
  "queries": [
    {
      "name": "list_samples",
      "reads": [
        "mod_food_lab_samples"
      ]
    }
  ],
  "pages": [
    "Samples",
    "SampleForm",
    "SampleDetail",
    "Standards",
    "Categories",
    "Companies",
    "Reports"
  ],
  "capabilities": {
    "filesystem": "none",
    "network": "none",
    "clock": true,
    "cpu_ms": 5000,
    "memory_mb": 64,
    "max_instances": 4,
    "max_payload_bytes": 1048576
  },
  "sensitive_resources": [
    "sample",
    "result",
    "report"
  ],
  "derived": [
    {
      "function": "compute_verdict",
      "table": "mod_food_lab_results",
      "frozen_when": {
        "column": "is_in_signed_report",
        "equals": 1
      }
    }
  ],
  "replay": {
    "events_unaffected": true,
    "upcasters": []
  },
  "rule_version": 1
}

```
derived declares which module functions recompute_derived (ADR-015) may call and which rows are frozen; the compiler reads it from the verified manifest and never hard-codes a table. replay declares, per version, either events_unaffected: true or a list of upcasters; CI rejects a publish that changes apply_event semantics and declares neither (ADR-006).

### The binding section (signed per device, per licence renewal)

The binding section is **unique to each device**. It is signed by the
`project_license` key and the `device_bind` signature. Renewal re-signs
only this section — no re-encryption, no re-publish.

```json
{
  "project_id": "proj_a1b2c3",
  "license_id": "lic_...",
  "license_expiry": "2026-12-20T00:00:00Z",
  "device_pubkey": "<this device's Ed25519 public key>",
  "content_key_slot": "<Content Key wrapped to this device's X25519 key>",
  "ciphertext_sha256": "<SHA-256 of binary.wasm.enc as delivered>",
  "issued_at": "2026-11-20T00:00:00Z"
}
```

### Bundle layout

```
bundle/
├── manifest.json                  ← contains both sections, canonicalised with JCS
├── manifest.sig.cloud_root        ← Ed25519 over module_hash (ONCE at publish)
├── manifest.sig.project_license   ← Ed25519 over bundle_hash (per device)
├── manifest.sig.device_bind       ← Ed25519, Cloud signing service (per device)
├── cert_chain.pem                 ← project licence cert → Cloud root
├── binary.wasm.enc                ← AES-256-GCM encrypted module logic
├── migrations/                    ← NNN.sql files, hashed in manifest
│   └── 001.sql
└── ui/                            ← signed static UI assets (ADR-011)
    ├── index.html
    ├── module.js
    └── module.css
```
manifest.json is one JSON object with exactly two keys: { "module": <module section>, "binding": <binding section> }, canonicalised with JCS. module_hash covers JCS(manifest.module); bundle_hash covers JCS(manifest.binding). Any other top-level key is rejected. The v1 example in v1/02-DATA-MODEL.md must use this shape. 

### The three hashes and three signatures

All hashes are SHA-256. In every concatenation and JSON tuple a hash is **lowercase 64-character hex** (fixed length, so concatenation is unambiguous — the same rule as the audit chain, Principle 11).

```text
module_hash = SHA-256( "platform.module.v1" || JCS(manifest.module) )
bundle_hash = SHA-256( "platform.bundle.v1" || module_hash_hex || JCS(manifest.binding) )

cloud_root      = Ed25519_Sign( CloudRootKey,      module_hash_bytes )   // ONCE at publish (quorum ceremony, ADR-013)
project_license = Ed25519_Sign( ProjectLicenceKey, bundle_hash_bytes )   // per device, per renewal
device_bind     = Ed25519_Sign( CloudSigningKey,
                    "platform.bind.v1" || JCS({ bundle_hash, device_pubkey,
                                                project_id, license_expiry }) )   // per device, per renewal
```

`*_bytes` are the 32 raw digest bytes. Ed25519 hashes its input internally, so signing the digest is standard; the domain tag lives inside the digest pre-image.

- `cloud_root` is produced ONCE at publish (quorum ceremony, ADR-013).
- `project_license` and `device_bind` are produced per device, per renewal.

### What each signature proves

| Signature | Signs | Frequency | Proves |
|---|---|---|---|
| `cloud_root` | `module_hash` | Once at publish (quorum) | "We published this module code" |
| `project_license` | `bundle_hash` | Per device, per renewal | "This project, on this plan, may run it" |
| `device_bind` | bind tuple | Per device, per renewal | "Bound to this specific device's key" |

### device_bind verification



At verification the device:
1. Verifies the signature with the Cloud public key (embedded root or delegated cert).
2. Checks `device_pubkey` in the signed tuple equals its own Ed25519 public key.
3. Checks `license_expiry` is in the future (monotonic clock anchor, ADR-014).
For a `perpetual` bundle `license_expiry` is the JSON value `null` in both the binding section and the `device_bind` tuple; step 3 is skipped.
It is a **signature, never a MAC**. No shared secret exists.

### Why the split matters

Without the split, `cloud_root` would sign every device's bundle. That
means the root key (HSM, quorum ceremony) would be needed for every
30-day licence renewal — operationally impossible.

With the split:
- **Publish** = quorum ceremony, signs module_hash once.
- **Issue/renew** = automated Cloud process, signs binding per device.
- Renewal re-signs only the binding section. No re-encryption needed
(the Content Key and ciphertext are unchanged; only `license_expiry`
and `issued_at` change in the binding).

**Issuance.** The Cloud registry stores the published **plaintext** module binary and UI (module code is not customer data). For each device the signing service generates a Content Key, encrypts the binary, wraps the key to the device's X25519 key, builds the binding section, and produces `project_license` and `device_bind`.

---

## Migrations in the bundle

Each bundle carries a `migrations/` directory containing forward-only
`.sql` files (`001.sql`, `002.sql`, ...). The directory is hashed in
`manifest.migrations_sha256`.

At install time, the host:
1. Takes a pre-migration snapshot (ADR-005).
2. Verifies every statement touches only `mod_<module_id>_*` tables.
3. Runs the migrations inside the install transaction.
4. Records the applied version in `schema_version(scope='module', version=N)`.

This is how a new module creates its tables — the answer to "owner
creates new modules" (ADR-006).

For v1, the food-lab migrations are embedded in the app binary and split
into `platform/` and `food_lab/` directories. In Phase 6b they move into
the bundle.
---

## Verification flow

### At install time

```
1. Parse manifest.json; compute module_hash and bundle_hash
2. Verify cloud_root signature over module_hash
   (embedded Cloud root key)
3. Verify cert_chain.pem terminates at embedded root;
   verify project licence cert is within its validity window
4. Verify project_license signature over bundle_hash
5. Verify device_bind signature; check device_pubkey == own key;
   check license_expiry is future
6. Compute SHA-256 of binary.wasm.enc → compare ciphertext_sha256
7. Unwrap content_key_slot with X25519 private key → decrypt binary
8. Compute SHA-256 of plaintext → compare binary_sha256
9. Verify every ui/ asset hash → compare ui_sha256
10. Verify migrations/ hash → compare migrations_sha256
11. Check api_version is supported by this host
12. Run migrations inside install transaction (after snapshot)
13. Store bundle; register in module_registry
```

### At load time (every Wasmtime instantiation)

```
1. Re-verify all three signatures
2. Re-check cert validity and license_expiry (monotonic anchor)
3. Re-check module_registry: still licensed to this project?
4. Re-check device state: still the active Admin / active member?
5. Re-check member's module-access list (ADR-012)
6. Re-verify binary and UI hashes
7. All pass → instantiate with manifest capability grants
   Any fail → refuse, log security event, show plain-language reason
```

### User-device delivery

1. Admin assigns module access, or member requests it.
2. Cloud verifies: member of project, project licence permits module,
   member's module-access list includes it, device is ACTIVE.
3. Cloud issues a bundle bound to that User device (same three
   signatures, content key wrapped to that device's X25519 key).
4. User runs the full verification flow above independently.
5. User re-verifies at every load.

The User's runtime grants are restricted:
- Read access to its own authorised projection only
- Submit commands to the Admin (one-round-trip path, ADR-012)
- No direct database writes
- No audit-log access
- No module-management actions

---

## Bootstrap bundles (`bundle_kind = "bootstrap"`)

A bootstrap bundle is embedded in the installer, **before any device keypair
exists**. It therefore cannot be pre-encrypted to a device key. Defined behaviour:

- Ships as `module` section + `manifest.sig.cloud_root` + **plaintext**
`binary.wasm` + `migrations/` + `ui/`. No `project_license`, no `device_bind`,
no `cert_chain.pem`, no `content_key_slot`.
- Trust comes from `cloud_root` over `module_hash`, plus the app's own platform
code signature. Nothing else.
- On first launch the app generates its keypairs, generates a local Content Key,
**re-encrypts the wasm locally**, wraps it to its own X25519 key, and writes a
**local, unsigned binding** with `bundle_kind="bootstrap"`, its own
`device_pubkey`, the local `project_id`, and
`license_expiry = first_launch + 30 days` from the monotonic anchor.
- The local binding is bookkeeping, **not a trust claim**. It is never accepted
for a paid module, a custom module, or a User device.
- `module_registry`'s CHECK branches on `bundle_kind`: bootstrap requires
`cloud_root` only; **`licensed` and `perpetual` require all three signatures.**
A perpetual Plan 1 licence is still device-bound — treating it as signature-exempt
would be a piracy path.
- Standard modules only. Every use is logged locally.
- After the window, read-only. Reading, exporting, printing and local backup
always remain (Principle 14). One free activation replaces bootstrap bundles
with fully bound ones (ADR-023).

**Content Key reuse.** The Content Key is random per `(module_version, device)`
and never reused across devices or module versions. It **is** reused across
renewals of the same `(module_version, device)` — that is what makes renewal
cheap and keeps `ciphertext_sha256` stable.

**v1-foodlab note:** bootstrap is **deferred** in this milestone (see
`v1/DEVIATIONS.md`). The format is defined now so it never changes later.

---

## Consequences

### Positive
- Cannot copy a module to another project or device.
- Cannot modify the binary, UI, or migrations.
- Cannot use a module the plan does not allow.
- Cannot use a module on a non-active project.
- Actually self-revoking via `license_expiry`.
- Publish is a quorum ceremony; renewal is automated.
- One canonicalisation, one hash rule shared with the audit chain.

### Negative
- Install requires a Cloud round trip (accepted — rare operation).
- Admin/User device replacement re-issues bundles.
- Plan change re-issues licences.
- Bundle format is more complex than a single flat manifest.

### Neutral
- Signing is Ed25519 throughout. Content encryption is AES-256-GCM.
  Key wrapping uses X25519 + HKDF + AES-256-GCM.
- Bundles are per-device. Content Keys are per-bundle.

### Honest limit

The client runs on the customer's machine. Signatures, encryption,
sandboxing and load-time re-checks raise the bar substantially. But a
determined attacker with full control of a legitimately licensed device
can extract what that device can read. **This is a strong licensing gate,
not unbreakable DRM.** We state this plainly.

---

## Key rotation

| Key | Rotation | Notes |
|---|---|---|
| Cloud root | Annually | Re-sign ceremony for all ACTIVE module versions; old root kept until the ceremony completes (see below) |
| Cloud signing service | 90 days | Delegated cert chaining to root |
| Per-project licence key | 90 days or on plan change | Certificate validity matches |
| Device binding | Not a key — an expiring signature | Re-issued on licence refresh |
| Content Key | Per bundle | Never reused across devices or versions |
| Module version | New version = new module section = new cloud_root signature | Old versions valid until revoked or expired |

**Root rotation is a re-sign ceremony, not just an overlap.** `cloud_root` signs `module_hash` once per module version, so retiring a root would orphan every version it signed. Procedure: (1) ship the new root public key in an app update, so the embedded trust set holds old + new; (2) in one **quorum** ceremony re-sign `module_hash` of every ACTIVE module version with the new root (binding sections are untouched); (3) clients accept a `cloud_root` signature from **any** root in the embedded set; (4) remove the old root from the embedded set only after every ACTIVE version is re-signed **and** the minimum supported app version contains the new root.
---

## Alternatives Considered

**Cloud signature only.** Rejected: modules copy freely.

**Sign manifest AND binary separately, three times each.** Rejected:
the manifest already contains the binary hash. Redundant.

**device_bind as a MAC.** Rejected: requires a shared secret; a signing
key cannot do key derivation.

**Fetching the project public key from Cloud at verification time.**
Rejected: the Cloud is not a trust anchor for its own claim. Certificate
chain to the embedded root.

**No module/binding split.** Rejected: root key would sign every device
bundle, making a quorum publish ceremony impossible for renewals.

---

## Enforcement

- Cloud signing service is a separate process. Only the module registry
  can call it. Signing keys never loaded into the main API process.
- Lint: no module version can be ACTIVE without the signatures its `bundle_kind`
requires — three for `licensed` and `perpetual`, `cloud_root` only for `bootstrap`.
- Lint: `cloud_root` is never invoked outside the publish ceremony and the root-rotation ceremony. A code path
that signs a binding with the root key fails the build.
- Lint: no code path reaches `wasmtime::Module::new` without verification.
- Lint: no code treats a runtime-fetched public key as a trust anchor.
- Every verification attempt logged with project, module, device, result.
- Clock used for expiry is the monotonic anchor (ADR-014).

### Tests
- [ ] Tampered manifest → rejected
- [ ] Tampered ciphertext → rejected before decryption
- [ ] Tampered UI asset → rejected
- [ ] Tampered migration file → rejected
- [ ] Bundle copied to second device → device_bind pubkey check fails AND decryption fails
- [ ] Bundle copied to second project → project_license fails
- [ ] Cert not chaining to embedded root → rejected
- [ ] Expired license_expiry → refused at load time
- [ ] Clock rolled back → expiry still enforced via monotonic anchor
- [ ] Suspended project → refresh refused, bundle expires
- [ ] Unsupported api_version → clean "update the app" message
- [ ] Bootstrap bundle after 30 days → read-only, export still works
- [ ] Renewal re-signs binding only; module_hash and manifest.sig.cloud_root byte-identical
- [ ] Renewal never invokes the root key (assertion on the ceremony log)
- [ ] Renewal reuses the Content Key; ciphertext_sha256 unchanged
- [ ] `perpetual` bundle missing device_bind → refused
- [ ] Bootstrap bundle carrying a project_license → rejected as malformed
- [ ] Bootstrap plaintext wasm re-encrypted locally at first launch
- [ ] Rebuild with a missing module_version and no upcaster → loud failure
