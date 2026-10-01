# TASK ID: LAUNCH-026.1
# TITLE: Add: 3rd party security review request template
# STATUS: pending
# DEPENDENCIES: LAUNCH-025.2
# ALLOWED FILES: docs/security/PEN-TEST-REQUEST.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Template for requesting a pen-test from a third party.

## REQUIRED IMPLEMENTATION

Create `docs/security/PEN-TEST-REQUEST.md`:

```markdown
# Pen-test Request — Email Template

Use this to request a quote / kick-off from a pen-test firm.

---

**Subject**: Pen-test engagement request — Product platform

Hi [Vendor],

We'd like to engage your firm for a security assessment of the Product
platform before our public launch (target: [DATE]).

## Scope

1. **Cloud platform** — Hono HTTP API on Node.js, Postgres 16, MinIO
   - Auth: Argon2id password hash, JWT sessions, Ed25519 device keys
   - Surface: https://api.example.com (staging URL: https://staging.example.com)
   - Endpoints: ~80 (full list in `platform-cloud/openapi.yaml`)

2. **Desktop apps** — Tauri 2 + React 19 + Rust
   - Admin (source of truth, full read/write)
   - User (read-only, projection)
   - Binaries for macOS, Windows, Linux

3. **Module runtime** — Wasmtime with capability-based sandbox
   - Custom WIT interface
   - Triple signature verification (cloud_root + project_license + device_bind)

4. **Sync protocol** — WebSocket between Admin and User over our WireGuard mesh

## Out of scope

- Stripe (PCI compliant on their side)
- our mesh (no third party)
- The build environment / CI

## What we want

- **Black-box** approach: treat as a real attacker
- **OWASP WSTG** methodology + **MASVS** for the desktop apps
- Coverage: 100% of the public Cloud API; 50% of the Admin app;
  representative subset of modules
- Deliverable: written report with findings (CVSS 4.0), repro steps,
  suggested remediations

## Timing

- Quote by: [DATE]
- Kick-off: [DATE]
- Fieldwork: 2 weeks
- Report: 1 week after fieldwork
- Re-test (if needed): within 30 days

## Logistics

- Test accounts: we provide 1x admin, 5x user, all on staging
- Source code: we share via a private GitHub repo
- Communication: weekly sync (30 min Zoom), Slack for quick questions
- NDA: standard mutual NDA

## Budget

We're budgeting $30K-$50K for the initial engagement. Open to your
suggested scope.

Thanks,
[Your name]

---

## Vendor response checklist

When the vendor responds, we check:
- [ ] Quote within budget
- [ ] Methodology is OWASP WSTG + MASVS
- [ ] Team has at least 3 years' experience
- [ ] References from similar companies
- [ ] Carries E&O insurance
- [ ] Comfortable with our NDA
- [ ] Can start within 4 weeks
```

## TESTS

```bash
cd /workspace
test -f docs/security/PEN-TEST-REQUEST.md || { echo "FAIL"; exit 1; }
grep -q "Pen-test" docs/security/PEN-TEST-REQUEST.md || { echo "FAIL"; exit 1; }
echo "OK"
```
