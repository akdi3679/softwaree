# Pen-test Request - Email Template

## Subject

Pen-test engagement request - Product platform

## Body

Hi [Vendor],

We would like to engage your firm for a security assessment of the Product platform before our public launch (target: [DATE]).

### Scope

1. Cloud platform - Hono HTTP API on Node 22, Postgres 16, MinIO
   - Auth: Argon2id, JWT sessions, Ed25519 device keys
   - Surface: https://api.example.com (staging: https://staging.example.com)
   - Endpoints: see platform-cloud/openapi.yaml

2. Desktop apps - Tauri 2 + React 19 + Rust
   - Admin (source of truth, full read/write)
   - User (read-only projection)
   - Binaries for macOS, Windows, Linux

3. Module runtime - Wasmtime with capability-based sandbox
   - Custom WIT interface
   - Triple signature verification (cloud_root + project_license + device_bind)

4. Sync protocol - WebSocket between Admin and User over our WireGuard mesh

### Out of scope

- Stripe (PCI compliant on their side)
- WireGuard protocol itself
- Build environment and CI

### Deliverable

- Black-box approach: treat as a real attacker
- OWASP WSTG + MASVS methodology
- Written report with findings (CVSS 4.0), repro steps, suggested remediations

### Timing

- Quote by: [DATE]
- Kick-off: [DATE]
- Fieldwork: 2 weeks
- Report: 1 week after fieldwork
- Re-test: within 30 days

### Logistics

- Test accounts: 1x admin, 5x user on staging
- Source code: private GitHub repo
- Communication: weekly 30-min sync + Slack
- NDA: standard mutual NDA

### Budget

$30K-$50K for the initial engagement.

Thanks,
[Your name]

## Vendor response checklist

- [ ] Quote within budget
- [ ] OWASP WSTG + MASVS methodology
- [ ] Team has 3+ years experience
- [ ] References from similar companies
- [ ] Carries E and O insurance
- [ ] Comfortable with NDA
- [ ] Can start within 4 weeks