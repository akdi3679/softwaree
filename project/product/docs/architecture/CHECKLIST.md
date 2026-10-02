# Architecture Checklist

> **Status:** Active
> **Use:** run this checklist on every PR that touches architecture
> **Owner:** whoever reviews the PR

Answers are yes/no. Every "no" must be justified in the PR description.

---

## A. Boundaries (Principle 1, 12)

- [ ] Does the change respect one-owner-per-datum? (No datum is
      authoritative in two systems.)
- [ ] Does the change keep Cloud out of the business-data path?
- [ ] Does the change avoid importing Cloud source into `product/`?
- [ ] If a new shared type was added, is it in `packages/contracts` and
      not duplicated in `platform-cloud`?

## B. Authority (Principle 2, 3)

- [ ] If the change touches project writes, is the Admin still the sole
      authority for that datum?
- [ ] Does the User app still refuse writes when the Admin is offline?
- [ ] If a User write path was added, does it go through the four-step
      handshake (CommandRequest -> AckGotten -> ApplyRequest -> Applied)?

## C. Transactions (Principle 4)

- [ ] Do all state changes and their outbox events commit in the same
      DB transaction?
- [ ] Is there any code path that writes to a business table outside the
      command engine?
- [ ] If the change can fail mid-write, does the transaction roll back
      cleanly with no orphaned outbox rows?

## D. Authorization (Principle 5)

- [ ] Is authorization re-checked at every boundary the change touches?
- [ ] If the change adds an event delivery path, is `canRead` re-evaluated
      at delivery time?
- [ ] Are role changes reflected immediately (no cached permissions)?

## E. Idempotency (Principle 6)

- [ ] Does every new command carry an idempotency_key?
- [ ] Is the key stored with the resulting event?
- [ ] Does a duplicate command return the previous result instead of
      re-executing?

## F. Trust (Principle 7)

- [ ] Is the Cloud re-validating even authenticated/authorized requests?
- [ ] Are modules treated as untrusted by the Admin?
- [ ] Is there no code path that trusts a client-supplied ID without
      a server-side check?

## G. Module boundaries (Principle 8)

- [ ] Does the module only read its own `mod_<name>_*` tables?
- [ ] Does the module only call host functions declared in its manifest?
- [ ] If a new capability was added, is it in the manifest and granted
      explicitly at instantiation?
- [ ] Does the module compile to `wasm32-wasip2`?

## H. Backups & keys (Principle 9)

- [ ] If a new encrypted artifact is added, is it encrypted before it
      leaves the device?
- [ ] Is the decryption key escrowed (wrapped) with the Cloud, if this
      is a backup?
- [ ] If this is a manual Plan-4 backup, is the passphrase key NOT escrowed?

## I. Updates (Principle 10)

- [ ] Does every new update type run through the standard pipeline
      (discover -> verify -> backup -> lock -> apply -> verify -> commit)?
- [ ] Is a rollback path defined for a failed update?
- [ ] If the update is critical, is there a deadline that blocks app
      start?

## J. Audit (Principle 11)

- [ ] Is every new state change audited with a hash-chained entry?
- [ ] Does the audit entry include actor, action, target, result,
      details?
- [ ] Is the new audit entry append-only (no update/delete path)?
- [ ] If the change touches Corbeille, does it record the quota
      retirement event?

## K. Hardening (Principle 13)

- [ ] If a new CPU or memory-heavy path was added, is it bounded?
- [ ] If a new network path was added, is it rate-limited?
- [ ] Is the production binary still built with strip + LTO +
      panic=abort?
- [ ] Is there any code path that could leak the device private key or
      the project encryption key?

## L. Testing & doc

- [ ] Does the change have tests? (Rust: `cargo test`. TS:
      `vitest`.)
- [ ] Do `cargo check` and `tsc --noEmit` pass clean?
- [ ] Was the ADR updated if the change is architectural?
- [ ] Was the HANDOFF.md updated if the change closes or opens a
      Category C item?

---

## How to use this in a PR

Paste the checklist in the PR description. Check each item or write
"N/A: <reason>". A reviewer rejects any PR with an unchecked item and
no justification.