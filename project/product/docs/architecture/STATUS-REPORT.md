# Architecture Status Report

Updated: 2026-09-23

## v1.0 GA - READY

The platform spec is complete. All architecture docs are written.

## What is done

| Area | Status |
|---|---|
| Repositories (product, cloud, infra) | Done |
| Contracts (types, protocol, SDK) | Done |
| Cloud API (accounts, auth, projects, modules, billing, backups) | Done |
| Admin app (Tauri, Rust backend, React UI) | Done |
| User app (Tauri, projection client) | Done |
| Sync protocol (frames, handshake, snapshot) | Done |
| Business modules (9 total) | Done |
| Security (auth, crypto, audit chain) | Done |
| Observability (metrics, tracing, logs) | Done |
| Backup (scheduler, restore, verify, rotation) | Done |
| Billing (Stripe checkout, webhooks, proration) | Done |
| Onboarding (signup, email verify, first-run wizard) | Done |
| Email (SMTP templates) | Done |
| Notifications (in-app, web push) | Done |
| i18n (8 languages) | Done |
| Accessibility (keyboard nav, focus trap, axe-core) | Done |
| PDF generation (prescriptions, lab reports) | Done |
| Full-text search (FTS5) | Done |
| Analytics (KPI dashboards) | Done |
| Compliance docs (GDPR, HIPAA, SOC 2) | Done |
| Marketplace (publisher flow, review queue) | Done |
| Support tools (CLI, diagnostics, runbooks) | Done |
| Multi-region routing | Done |
| Chaos and load tests | Done |
| Release pipeline (Changesets, GitHub Actions) | Done |

## What remains (before public launch)

- Pen-test engagement (4-8 weeks elapsed time)
- 5 beta customer onboarding
- v1.0 tarball refresh
- Fill in the placeholder vendor names in legal docs

## Deferred to v2

- Multi-Admin per project
- Offline writes
- Mobile native apps
- SSO/SAML
- Public API

## Total tasks

About 1000 tasks across 44 phase directories.
