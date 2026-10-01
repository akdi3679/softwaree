# TASK ID: AUDIT-005.1
# TITLE: Self-audit fix #1: ADR-011 Admin auth UX (no prompts by default)
# STATUS: pending
# DEPENDENCIES: none
# ALLOWED FILES: docs/architecture/02-DECISIONS/ADR-011-admin-auth-ux.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Document the rule: Admin signs in once, then no prompts for daily operations.
Prompts only for destructive/sensitive actions.

## WHY THIS WAS FOUND IN SELF-AUDIT
The original spec implied prompts for important actions. That's annoying
and trains users to click "yes" without thinking (worse than no prompt).
Linear / Notion model is better.

## REQUIRED IMPLEMENTATION

Create `docs/architecture/02-DECISIONS/ADR-011-admin-auth-ux.md`:

```markdown
# ADR-011: Admin Auth UX — No Prompts by Default

## Status
Accepted, 2026-08-09

## Context

Many apps ask the user to confirm every important action ("Are you sure
you want to delete this patient?"). This is annoying and trains users
to click "Yes" without reading.

For an Admin who is the source of truth and the only one who can write,
asking them to re-confirm every action is friction without benefit.

## Decision

**Once an Admin is signed in, no prompts for daily operations.**

### Sign-in flow (one time per session)
1. Password
2. TOTP code (if enabled)
3. Session token stored in OS keychain (auto-renewed for 30 days)

### After sign-in
- Device private key signs every command automatically
- No password re-entry
- No TOTP re-entry
- No "are you sure?" prompts
- Commands execute in <100ms

### Prompts are reserved for

| Action | Why prompt |
|---|---|
| Sign out | destructive to the session |
| Replace Admin device | transfers project ownership |
| Delete project | destructive |
| Change billing plan | involves money |
| Remove all users | bulk destructive |
| Rotate device key | rare, security-critical |
| First user invite (no users yet) | prevent misconfiguration |
| First module install (per project) | establish trust |

### Modules can NEVER prompt

Modules are sandboxed (Wasmtime) and have no UI access. They cannot show
a confirmation dialog. They either accept the command or reject it.
This is a security feature: prevents a malicious module from social-
engineering the user.

### Audit

Every command is logged in the audit chain with the device key's
signature. If a destructive action was taken accidentally, the audit
log is the recovery tool (manual rollback from snapshot).

## Consequences

### Positive
- Admin feels fast, modern (Linear-like)
- Less prompt fatigue = better security (user notices when prompted)
- Modules stay simple (no UI)
- Clear mental model: "I'm signed in, I'm trusted"

### Negative
- Accidental deletes are easier (no undo)
- A compromised device has full power until device revoked

### Mitigations
- Confirmation prompts for destructive actions (see table above)
- Audit log + daily backup + 30-day snapshot = full recovery
- Device can be remotely revoked from any User app (or Cloud)
- Idle session timeout: 30 days, then re-auth

## References
- Linear's auth model (no prompts for normal actions)
- Notion's auth model
- 1Password's "ask once" pattern
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/02-DECISIONS/ADR-011-admin-auth-ux.md || { echo "FAIL"; exit 1; }
grep -q "No Prompts by Default" docs/architecture/02-DECISIONS/ADR-011-admin-auth-ux.md || { echo "FAIL"; exit 1; }
echo "OK"
```
