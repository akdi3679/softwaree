# TASK ID: ARCH-020.1
# TITLE: Add architecture: 12-month roadmap
# STATUS: pending
# DEPENDENCIES: USER-024.2
# ALLOWED FILES: docs/architecture/ROADMAP.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
What we build, in what order.

## REQUIRED IMPLEMENTATION

Create `docs/architecture/ROADMAP.md`:

```markdown
# Roadmap

## Q3 2026 (now → Sep)

- v1.0 GA: Admin + User + medical-reception + food-lab
- 5 paying customers
- 10 published modules
- Cloud in single-VM stage 0
- Internal-infra: our mesh, Infisical, Woodpecker

## Q4 2026 (Oct → Dec)

- v1.1: Improvements based on feedback
  - Better onboarding wizard
  - More medical features (prescriptions, lab orders)
  - More food-lab features (equipment, methods)
- Marketplace: publisher UI, public module browse
- Portal: customer self-service (devices, invoices, team)
- 25 paying customers
- 25 published modules

## Q1 2027

- v1.2: Polish + retention
  - Search across all projects
  - PDF reports
  - Voice notes
  - Multi-region Cloud
- Enterprise plan launch
- 50 paying customers
- SOC 2 Type I
- 50 published modules

## Q2 2027

- v1.3: Real-time + collaboration
  - Live event ticker on Admin
  - Telemedicine (WebRTC)
  - Video tutorials
- 100 paying customers
- HIPAA full audit
- 100 published modules

## Q3 2027

- v1.4: Vertical depth
  - Insurance billing (medical)
  - LIMS integration (food-lab)
  - Imaging (medical)
  - Inventory (retail)
- 200 paying customers
- 200 published modules

## Q4 2027

- v1.5: Scale
  - 10K-user load test passed
  - Multi-region: 3 regions
  - Cloud in stage 2
- 500 paying customers
- 300 published modules

## 2028 (v2)

- Multi-Admin per project
- Offline writes with conflict resolution
- Mobile (iOS + Android native)
- Public API for third-party integrations

## Non-roadmap

We are NOT building:
- Email client
- Calendar
- File storage (use S3 / MinIO; we just integrate)
- Web-only version (we're local-first; web is the portal, not the app)
- Slack competitor
- AI assistant (yet; v3 maybe)
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/ROADMAP.md || { echo "FAIL"; exit 1; }
grep -q "Q3 2026" docs/architecture/ROADMAP.md || { echo "FAIL"; exit 1; }
echo "OK"
```
