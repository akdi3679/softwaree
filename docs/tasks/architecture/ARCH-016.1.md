# TASK ID: ARCH-016.1
# TITLE: Add architecture: design principles cheat sheet
# STATUS: pending
# DEPENDENCIES: ADMIN-045.2
# ALLOWED FILES: docs/architecture/PRINCIPLES-CHEATSHEET.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
One-page summary of our principles. For new hires.

## REQUIRED IMPLEMENTATION

Create `docs/architecture/PRINCIPLES-CHEATSHEET.md`:

```markdown
# Principles Cheat Sheet

When in doubt, use this.

## 1. Local-first
Customer's data lives on their Admin. Cloud is control plane only.
✓ Use SQLite per project.
✓ Allow offline reads.
✗ Don't depend on Cloud for any data write to work.

## 2. Defense in depth
Every layer adds security. Never trust a single layer.
✓ Authenticate every request.
✓ Authorize every action.
✓ Sign every event.
✓ Encrypt every backup.
✓ Audit every change.
✗ Don't say "we have HTTPS, so it's secure."

## 3. Single Admin per project
One source of truth. No merge conflicts.
✓ One Admin = one device key.
✓ Replacement requires a signed ceremony.
✗ Don't allow multiple Admin devices in v1.

## 4. User is read-only
Users are projections. They never write.
✓ Sync only. Apply events.
✓ Local queries against local projection.
✗ Don't let Users mutate data.

## 5. Triple-signed modules
Untrusted code from anywhere can run, safely.
✓ Verify all three signatures: cloud_root, project_license, device_bind.
✓ Capability-based WASM sandbox.
✗ Don't trust the marketplace.

## 6. Event-sourced
Facts are append-only. State is derived.
✓ Every change is an event.
✓ Hash chain. Immutable.
✗ Don't UPDATE events. Don't DELETE events.

## 7. Fail safely
When in doubt, refuse. Never silently corrupt.
✓ Validate everything. Reject unknown.
✓ Default deny. Default read-only.
✗ Don't "try and see" with security.

## 8. Self-host
No vendor lock-in. We (and customers) can leave.
✓ Open source where possible.
✓ Standard protocols (WireGuard, S3, Postgres, WASM).
✗ Don't depend on a proprietary API to be useful.

## 9. Minimum cost
Small at every stage. Scale out, not up.
✓ Self-hosted. Use Hetzner. Use Cloudflare free.
✓ Tune SQLite. Use WAL. Use indexes.
✗ Don't add cloud services "just in case."

## 10. Stupid-AI proof
Even an AI should be able to implement a feature perfectly.
✓ Micro-tasks. Exact code. Exact tests. Exact paths.
✓ One PR per task.
✗ Don't write vague tasks. Don't write "implement X."

## 11. Customer empathy
We're building for small businesses, not enterprises.
✓ Plain language. Clear UI. Sensible defaults.
✓ Self-service. Don't make them call us.
✗ Don't add features a customer didn't ask for.

## 12. Ship then learn
Done > perfect. Get feedback.
✓ Ship v1, iterate.
✓ Use feature flags.
✗ Don't wait for 100% before releasing.
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/PRINCIPLES-CHEATSHEET.md || { echo "FAIL"; exit 1; }
grep -q "Local-first" docs/architecture/PRINCIPLES-CHEATSHEET.md || { echo "FAIL"; exit 1; }
echo "OK"
```
