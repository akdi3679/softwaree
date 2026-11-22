# ADR-013: Private Channel and Owner Console

**Status:** Accepted — amended 2026-11-20 (review pass 2)
**Date:** 2026-11-20
**Amended:** Added minimal Owner Console for v1; added configurable approval quorum for solo owners.
**Deciders:** Architecture team
**See also:** ADR-007 (signing), ADR-015 (patching), ADR-021 (plans), ADR-022 (recovery)

---

## Context

The platform requires a private control surface for the owner to publish modules, manage plans, approve recoveries, and view platform audit logs. This surface must be strictly isolated from the customer-facing public API. Furthermore, quorum approval (default 2) is impossible for a solo owner.

## Decision

### 1. Network Isolation

The Cloud has two distinct services:
- **Public channel (`/v1/*`):** Serves customers.
- **Private channel (`/ops/*`):** Serves the owner. Binds *only* to the ops VPN interface. The public listener returns 404 for `/ops/*`. Customers have no route and no credentials.

### 2. The Owner Console (v1 scope)

For v1, the Owner Console is a minimal internal SPA providing:
- Read-only views of accounts, projects, devices, licences, payments, and backup metadata.
- Plan CRUD (creating/editing plans as data, ADR-021).
- Module publish pipeline (upload manifest/binary → sign → ACTIVE).
- Recovery approval queue.
- Platform audit log viewer.

The "Vertical" (e.g. Food Lab) is selected from the Cloud's **module catalog** (`GET /v1/modules`), so a new module appears in the project-creation flow with no app update. The app ships an **embedded fallback catalog** so first-run signup still works offline; it is refreshed on first Cloud contact and the Cloud copy wins.

### 2.1 Staff authentication

- Per-staff accounts. Never shared logins.
- **Hardware key (WebAuthn) required**, plus a second factor (TOTP). No password-only staff access, ever.
- Roles: **`owner`**, **`ops`**, **`support-read`**.
- Session TTL 15 minutes, idle timeout 10 minutes, all sessions revocable instantly.
- Joiners/leavers: staff access revoked in the same transaction as the HR event. Quarterly access review.
- The ops DB role has **read-only** access to customer metadata and **no** access to signing keys.

| Capability | Role | Approval |
|---|---|---|
| View accounts, projects, devices, plans, payments, backup metadata | `support-read`+ | — |
| Publish a module version (signs `module_hash`) | `owner` | quorum |
| Create / edit plans | `owner` | quorum |
| Re-issue or extend a project licence | `ops` | logged |
| Approve a live-heart patch | `owner` | **quorum, offline ceremony** (ADR-015) |
| Ring rollout / trigger kill-switch | `ops` | logged; kill-switch pre-signed |
| Approve escrow release for recovery | `owner` | **quorum + 48 h + customer alerts** (ADR-022) |
| Region routing, deployment, infra config | `ops` | logged |

### 2.2 Visibility is metadata-only

The Console can see: account id, email, plan, billing state, project id, business type, admin last name, device registry, module licences, backup blob sizes and timestamps, audit chain heads, discovery metadata.

The Console can **never** see: patient names, lab results, appointments, invoices, any business row, or plaintext backup content. There is no business data in the Cloud to see (Principle 1), and no code path that could fetch it.

**Support diagnostics** are the one exception and are customer-initiated: the customer clicks "Share diagnostics" in the Admin app, producing a scoped, time-boxed, redacted bundle. The Console reads only what the customer explicitly sent.

### 2.3 Owner actions and reads are audited

- Append-only, hash-chained, same rule as Principle 11: `SHA-256("platform.audit.v1" || prev_hash || JCS(entry))`, `prev_hash` as lowercase 64-char hex.
- Every entry records actor, role, action, target, before/after metadata, approval chain, source IP.
- **Reads of customer metadata are audited too**, not just writes, and are visible in the customer's own access log.
- Approvals record every approver identity and signature.
- The owner audit chain is snapshotted and reviewed weekly.

### 2.4 Break-glass

Emergency access (e.g. the only owner's hardware key is lost) exists and is deliberately unpleasant: time-boxed to **60 minutes**, requires the configured quorum of independent confirmations, alerts every owner contact, and forces a written post-incident review. It is never a silent path. In solo mode it still requires the hardware key, the mandatory delay and the alert.

### 3. Configurable Approval Quorum (Solo-Owner Mode)

Many ADRs (007, 015, 022) require quorum approval for high-risk actions (publishing, patching, escrow release). This is impossible for a solo founder/owner.

We introduce an `approvals_required` setting in the Owner Console (default: 2).

**Solo-Owner Mode (`approvals_required = 1`):**

When set to 1, the system enforces reduced assurance to compensate for the lack of a second human:

1. The single approver must use a hardware security key (WebAuthn/FIDO2).
2. A **mandatory 24-hour delay** between request and execution. This value is fixed, not configurable per action. For an escrow release the 24-hour delay runs **concurrently** with the 48-hour recovery wait; the case becomes executable at the later of (48 h after it opened) and (24 h after the single approval).
3. An **out-of-band alert** to a designated emergency contact (owner's personal email or legal representative) with a working cancel link.
4. The action is permanently logged in the platform audit chain with a `solo_approval` flag.
5. **`approver_id != requester_id` is explicitly relaxed in solo mode.** With one staff member it is unsatisfiable. The relaxation is a deployment-level fact recorded in the owner chain, not a silent bypass; at quorum ≥ 2 the check is enforced in code.
6. **Every customer-facing assurance string is generated from the deployment's quorum.** The ADR-022 §6 enrolment text and the recovery-case emails must say "one of our staff, a 24-hour internal delay and a 48-hour wait" in solo mode — never "two of our staff". These are tested strings; a solo deployment rendering the two-person text fails CI.
7. THREAT-MODEL A10's residual is stated for the actual quorum: at 1, a **single** compromised insider can approve an escrow release after the waits. This is disclosed, not hidden.

This allows a solo operator to run the platform securely while documenting the explicit reduction in blast-radius containment.

---

## Consequences

### Positive
- The private channel is structurally unreachable by customers.
- Solo owners can operate the platform without faking a second approver.
- The mandatory delay in solo mode provides a window to detect compromised credentials.

### Negative
- Solo mode has a weaker blast-radius containment than two-person approval.

---

## Enforcement

- The public listener drops `/ops/*` routes at the network edge.
- Staff authentication requires hardware keys.
- `approvals_required` is enforced in code, not policy.
- Solo-mode actions trigger the mandatory delay timer and the alerting service before execution.

### Tests
- [ ] Public listener: `/ops/anything` → 404 for GET/POST/PUT/DELETE
- [ ] Ops service binds only the ops interface; a config test fails the build on `0.0.0.0`
- [ ] Ops listener not reachable from a customer device
- [ ] Staff login without hardware key → refused
- [ ] `support-read` attempts module publish → refused, audited
- [ ] `approvals_required = 2` with 1 approval → blocked
- [ ] `approvals_required = 2`, same person requests and approves → refused
- [ ] `approvals_required = 1` → queued 24 h, alert sent, `solo_approval` flag set
- [ ] `approvals_required = 1` → customer-facing string says "one of our staff", never "two"
- [ ] Cancel link in alert → action aborted and audited
- [ ] Recovery approval before 48 h elapsed → refused
- [ ] Metadata read appears in the customer-visible access log
- [ ] Break-glass session expires at 60 minutes and alerts fire
- [ ] Ops DB role cannot read signing key material
- [ ] Plan created in Console → assignable with no code change
- [ ] Module catalog unavailable at first run → embedded fallback used, signup still works offline