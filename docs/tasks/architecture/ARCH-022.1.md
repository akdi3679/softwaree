# TASK ID: ARCH-022.1
# TITLE: Add architecture: "what's NOT in v1" doc
# STATUS: pending
# DEPENDENCIES: ADMIN-066.2
# ALLOWED FILES: docs/architecture/NOT-IN-V1.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Be explicit about what we don't ship in v1. Avoid surprises.

## REQUIRED IMPLEMENTATION

Create `docs/architecture/NOT-IN-V1.md`:

```markdown
# What is NOT in v1

To set expectations clearly.

## v2 features (planned 2028)

- **Multi-Admin per project** — still one Admin per project in v1. Multi-Admin
  requires conflict resolution (Raft or CRDT) and is complex. v2 only.
- **Offline writes** — v1: writes go through Admin, which needs connectivity to
  verify state on Cloud. Offline writes (for Users) come in v2.
- **Mobile native apps** — v1: only Tauri desktop (works on macOS, Windows,
  Linux). v2: iOS + Android native.
- **Real-time collaboration** — v1: events are eventually consistent (5s
  typical lag). v2: real-time CRDT-based collaboration.
- **Custom roles** — v1: 7 fixed roles (admin, doctor, nurse, etc.). v2: full
  custom role-permission matrix.
- **SSO / SAML** — v1: email + password + TOTP. v2: SAML 2.0, OIDC, LDAP
  for enterprise customers.
- **Audit log export with proofs** — v1: simple CSV. v2: signed evidence
  bundles (RFC 3161 timestamps).
- **Video calls in-app** — v1: not supported. v2: native WebRTC video calls.

## Never (we will not build)

- **CRM / sales / marketing** — different product.
- **Email client** — use your email.
- **Calendar** — use Google Calendar / Outlook.
- **Project management** (kanban, etc.) — use Trello / Asana.
- **Spreadsheets** — use Sheets / Excel.
- **Social features** (comments, @-mentions) — not in our security model.
- **AI assistant** — not in scope. We may add it as an opt-in module later.

## Maybe (deferred)

- **Voice transcription** — could be a module
- **OCR for documents** — could be a module
- **Webhooks / pub-sub for third-party integrations** — v2 if asked
- **Public API for developers** — v2
- **GraphQL** — no, we use a typed REST API
- **gRPC** — no, we use WebSocket for sync
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/NOT-IN-V1.md || { echo "FAIL"; exit 1; }
grep -q "Multi-Admin" docs/architecture/NOT-IN-V1.md || { echo "FAIL"; exit 1; }
echo "OK"
```
