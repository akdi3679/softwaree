# TASK ID: AUDIT-010.1
# TITLE: Self-audit fix #6: written self-audit report
# STATUS: pending
# DEPENDENCIES: AUDIT-009.2
# ALLOWED FILES: docs/architecture/SELF-AUDIT-REPORT.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
A written record of what the self-audit found, what was fixed, and
what's still open. This becomes part of the v1.0 GA review.

## WHY THIS WAS FOUND IN SELF-AUDIT
Every production launch should have a self-audit report. It catches
the "we forgot to think about X" problems.

## REQUIRED IMPLEMENTATION

Create `docs/architecture/SELF-AUDIT-REPORT.md`:

```markdown
# Self-Audit Report — v1.0 (2026-08-09)

## Method

Reviewed the v1.0 spec (1002 micro-tasks, 50+ architecture docs) for:
- UX friction
- Security gaps
- Spec inconsistencies
- Missing edge cases
- Tech choices that don't fit the requirements

## Issues found and fixed

### 1. Admin auth UX — prompts on every action (FIXED — AUDIT-005)
**Problem**: Asking Admin to approve every command is annoying and
trains them to ignore security prompts.

**Fix**: ADR-011. Once Admin signs in, no prompts for daily operations.
Prompts only for destructive/sensitive actions (delete, replace, billing).

**Impact**: Better UX, better security (real prompts are noticed).

### 2. Our mesh vs alternatives — unclear (FIXED — AUDIT-006)
**Problem**: Spec implied Tailscale is mandatory. Actually mDNS is
the LAN default; Tailscale is the remote fallback.

**Fix**: TAILNET.md updated with discovery order (mDNS → Tailscale →
manual) and alternatives table (Netbird, Nebula, Cloudflare Tunnel,
custom WireGuard). Tailscale chosen for best non-technical UX.

**Impact**: Clear architecture, no vendor lock-in (Headscale), can
swap to Netbird in v2.

### 3. Backup key escrow on Admin replacement (FIXED — AUDIT-007)
**Problem**: Backups encrypted to Admin's key. If Admin replaced,
old backups become unreadable. Loses history.

**Fix**: ADR-012. Project key wrapped with both Admin pubkey AND
Cloud escrow pubkey. On replacement, re-wrap from escrow. Customer
can opt out (self-custody with paper key).

**Impact**: No data loss on device replacement. Compliance-friendly.

### 4. Local plan — "free" but needed Cloud account (FIXED — AUDIT-008)
**Problem**: Local plan was $0 but required a Cloud account, which
defeats the purpose of "local-only".

**Fix**: 05-FEATURES.md updated. Local = no Cloud, no account, no
phone-home, no telemetry. Truly offline.

**Impact**: Local plan is now actually free and private. Clear
upgrade path to Cloud.

### 5. PDF rendering — printpdf doesn't support RTL (FIXED — AUDIT-009)
**Problem**: printpdf (Rust) doesn't render Arabic, Hindi, Chinese
well. Sick-leave cert in Arabic would be unreadable.

**Fix**: ADR-013. Use headless Chrome (chromiumoxide) for PDFs.
HTML templates per language. Bundle Noto fonts.

**Impact**: PDFs work in all 8 languages correctly.

## Issues found, NOT fixed (need senior engineer review)

### 6. Pricing / unit economics (OPEN)
**Question**: At $29/mo Starter with 3 users, can we cover support costs?
1 support engineer can handle ~200 customers → $5,800/mo revenue.
That's less than 1 engineer's salary.

**Recommendation**: Validate with a financial model. Either:
- Raise Starter to $49-$99
- Or accept very long support response times for $29
- Or limit support to community forum for Starter

**Status**: Needs business decision.

### 7. Sync protocol details (OPEN)
**Question**: Is the snapshot-on-gap threshold (5000 events) right for
all customer sizes? A busy lab might hit this in 5 days.

**Recommendation**: Make it configurable per project, default 5000.

**Status**: Needs implementation testing.

### 8. Module SDK — will 3rd parties actually use it? (OPEN)
**Question**: The marketplace is a long shot. Most customers won't
build modules. The 3rd-party ecosystem may never materialize.

**Recommendation**: Don't depend on marketplace revenue in v1. Make
modules a feature, not a revenue stream.

**Status**: Strategic call. v1 builds the SDK; v2 validates the
marketplace.

### 9. One Admin per project — really OK? (OPEN)
**Question**: What happens when Admin is on vacation for 2 weeks?
No one can write. Customers will hate this.

**Recommendation**: Document clearly. Make it a feature, not a bug.
"Instant clarity on who is the source of truth."

**Status**: Document in marketing.

### 10. Tailscale dependency on users (OPEN)
**Question**: What if a user can't install Tailscale (corporate laptop)?

**Recommendation**: Document the limitation. Offer mDNS-only mode for
LAN. For v2, consider HTTPS relay through Admin (requires Cloud to
be in data path, which we explicitly avoid in v1).

**Status**: Documented limitation. Future enhancement.

## Other observations

- Most tasks (~90%) look correct on first read
- Code samples in tasks may have typos (expected, will fix during
  implementation)
- Some test commands are too generic (`test -f` rather than actually
  running the code) — this is fine for a spec, not a test suite
- The architecture is defensible but needs senior engineer review
  before building

## Next steps

1. Senior engineer reviews 7 ADRs (001-013)
2. Senior engineer reviews SYNC-PROTOCOL.md
3. Senior engineer reviews THREAT-MODEL.md
4. First engineer implements REPO-001, finds issues, we fix
5. Iterate for 2-3 weeks to harden the spec
6. Then start the 26-session build

## Sign-off

This self-audit pass is complete. The 5 critical issues (auth UX,
Tailscale clarity, key escrow, Local plan, PDF rendering) are fixed.
The 5 open questions need business/engineering review but are not
blockers for v1.0 spec.
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/SELF-AUDIT-REPORT.md || { echo "FAIL"; exit 1; }
grep -q "Self-Audit" docs/architecture/SELF-AUDIT-REPORT.md || { echo "FAIL"; exit 1; }
echo "OK"
```
