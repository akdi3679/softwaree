# ADR-023: Offline Bootstrap and Activation

**Status:** Accepted
**Date:** 2026-11-20
**Deciders:** Architecture team
**See also:** ADR-007 (bootstrap bundles), ADR-014 (licence states + clock), ADR-018 (QR pairing), ADR-021 (Plan 1), ADR-022 (keys), Principle 14

---

## Context

The product is local-first, and some customers are air-gapped or have unreliable connectivity on day one. But three things genuinely require the Cloud at least once:

- A **project licence** and a **per-project licence key** (ADR-014)
- **Device-bound module bundles** (ADR-007)
- **Membership certificates** for User devices (ADR-012)

Without a defined bootstrap, "local-first" would silently mean "internet required before anything works", and the first-run experience would fail in exactly the clinics that most need offline operation.

## Decision

**The Admin works from the first launch, with no Cloud contact, inside a bounded bootstrap state. Activation converts it to a normal licence.**

### 1. First run, no connectivity

```
1. Install (no administrator rights required — ADR-024)
2. Create the local account profile on the device
3. Generate the device keypairs (Ed25519 + X25519) in the OS keychain
4. Generate the project keys and keyring (ADR-022)
5. Fill the four project fields: project name, Admin last name,
   business type, business name (00-OVERVIEW §6.1)
6. project.db is created locally, schema migrated, audit chain started
7. Embedded standard modules load as BOOTSTRAP BUNDLES (ADR-007)
8. The app is fully usable for a single Admin
```

No account password, no Cloud session, no invitation, no plan picker is required to reach step 8.

### 2. What the bootstrap state permits

| Allowed | Not allowed |
|---|---|
| Full single-Admin operation of the standard modules | Enrolling User devices (needs membership certificates) |
| Local backup and export, always | Cloud backup (needs a licence + custody mode) |
| Audit chain, corbeille, corrections | Custom modules (Plan 4 entitlement) |
| Setting the clock anchor | Discovery heartbeats (nothing to publish yet) |

The bootstrap state is **Plan 1-equivalent**: 1 Admin, 1 project, 0 Users.

### 3. The grace window

- **30 days** from first launch, measured by the monotonic clock anchor (ADR-014), not the wall clock.
- Bootstrap bundles are signed by `cloud_root` **only** — no project licence, no device binding. They are the single, time-boxed exception to the three-signature rule (ADR-007), they cover only the standard modules, and every use is logged.
- The app shows a persistent, non-blocking banner: "Not yet activated — N days of offline setup remaining. Activate free at any time."
- **At the end of the window, the project becomes read-only.** Reading, exporting, printing and local backup continue to work forever (Principle 14). Nothing is deleted, and no data is held hostage.

### 4. Activation (one round trip, free)

```
1. Device connects to the Cloud, registers both public keys (ADR-010)
2. Account is created or linked, with a mandatory second factor
3. Plan is chosen: Plan 1 (perpetual local) or a paid plan / trial
4. Cloud issues:
     - the project licence (perpetual for Plan 1, 30-day renewable otherwise)
     - the per-project licence key + certificate
     - device-bound module bundles (ADR-007)
     - the Admin authority certificate (ADR-012)
5. Custody mode is chosen for Cloud backups, if the plan includes them (ADR-022)
6. Bootstrap bundles are replaced by fully bound bundles
7. All data created during bootstrap is preserved — activation never wipes,
   re-keys away, or migrates the customer's work
```

After activation, **Plan 1 never needs the Cloud again**. Paid plans refresh on the 30-day cycle with a 14-day grace (ADR-014).

### 5. Truly air-gapped sites: offline activation

For a site that will never have internet on the Admin machine, activation is available as a **signed offline activation file**:

```
1. On any internet-connected device, the customer (or support) completes
   activation for the Admin device's public key
2. Cloud produces an activation file, signed by the Cloud root, containing:
     project licence, licence certificate, Admin authority certificate,
     and device-bound module bundles for that pubkey
3. The file is carried by USB to the Admin machine and imported
4. The Admin verifies the root signature and the embedded device pubkey,
   exactly as it would online (ADR-007)
```

This is the same cryptography with a different delivery channel. It is not a bypass, and it does not weaken binding: the bundles are still bound to that device's key. Renewal for a paid plan uses the same channel; Plan 1 needs it once.

### 6. Users and offline pairing

- **During bootstrap:** no Users. Membership certificates do not exist yet.
- **After activation:** Users are enrolled through the invitation flow (ADR-010). An already-enrolled device can be **re-paired offline** by QR (ADR-018), because the certificates are cached locally and the Admin is the project authority.
- **While the Cloud is offline after activation:** everything continues — reads, writes, roles, revocation — under membership certificates and the licence grace window (ADR-012, ADR-014).

---

## Consequences

### Positive
- The first launch works with no internet, no account and no plan decision.
- The air-gapped case has a real, cryptographic path rather than an exception carved into the security model.
- Activation never destroys bootstrap work.
- The bootstrap exception is time-boxed, module-limited, and cannot run a paid module.

### Negative
- Two activation channels (online + offline file) means two code paths to test.
- The 30-day window will surprise a customer who ignores the banner; the read-only outcome must be explained well before it happens.
- Offline activation requires a second device or a support interaction, which is friction — but it is honest friction, not a security hole.

### Neutral
- The clock anchor starts at first launch and persists; rolling the wall clock back does not extend the window.
- Bootstrap uses the same `project.db`, the same audit chain and the same keyring as an activated project. There is no "temporary database" to migrate.

---

## Alternatives Considered

**Require internet before first use.** Rejected: it contradicts local-first and fails in the clinics we are building for.

**Unlimited offline operation with no activation.** Rejected: module binding and licence revocation would be unenforceable, which is the payment gate (ADR-007, ADR-014).

**Bootstrap bundles with no expiry.** Rejected: an unexpiring, unbound, root-only bundle is a piracy path for the standard modules.

**Delete bootstrap data if the window lapses.** Rejected absolutely: Principle 14.

**Let Users enrol during bootstrap with Admin-signed certificates.** Rejected for v1: it would create a second class of membership credential and a migration problem at activation. Re-pairing already-enrolled devices offline covers the real need.

---

## Enforcement

- The bootstrap state is a named licence state in `license_state`, not a boolean scattered through the code.
- Bootstrap bundles are verified by a dedicated path that accepts `cloud_root` only, refuses any non-standard module, and refuses to run past the anchor deadline.
- Lint: no code may extend the bootstrap window; only a successful activation changes the state.
- The offline activation importer runs the **full** ADR-007 verification, including the device pubkey check.
- Export, print and local backup are reachable in the bootstrap and bootstrap-expired states — asserted by CI.

### Tests
- [ ] Fresh install with no network → project created, standard modules run
- [ ] Bootstrap day 31 → read-only; read, export, print, local backup still work
- [ ] Wall clock rolled back during bootstrap → window not extended
- [ ] Activation preserves every record created during bootstrap
- [ ] Plan 1 activated, then offline for 90 days → fully operational
- [ ] Offline activation file for a different device pubkey → refused
- [ ] Tampered offline activation file → refused
- [ ] Custom module during bootstrap → refused
- [ ] User enrolment during bootstrap → refused with a clear reason
- [ ] Already-enrolled User re-paired by QR with the Cloud unreachable → connects