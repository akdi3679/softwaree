# TASK ID: ARCH-010.1
# TITLE: Add architecture: 3rd-party services catalog
# STATUS: pending
# DEPENDENCIES: ADMIN-032.2
# ALLOWED FILES: docs/architecture/SERVICES.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
List every external service, why we use it, and what data crosses the boundary.

## REQUIRED IMPLEMENTATION

Create `docs/architecture/SERVICES.md`:

```markdown
# 3rd-Party Services Catalog

Every service we use. For each: purpose, data shared, what we DON'T share, and our exit plan.

## Stripe (Payments)

- **Purpose**: Subscription billing
- **Shares**: customer name, email, payment method (PAN tokenized), invoices
- **Does NOT share**: business data, project data, modules
- **Data on Stripe**: account info, payment methods, subscriptions, invoices
- **Compliance**: PCI DSS Level 1 (handled by Stripe)
- **Exit plan**: export customer list; pause subscriptions; switch to Paddle/Lemon Squeezy

## Our WireGuard mesh (Networking)

- **Purpose**: Mesh VPN between customer devices
- **Shares**: device names, IPs
- **Does NOT share**: business data (all encrypted in transit)
- **Data on our WireGuard mesh**: device public keys, IP assignments, ACLs
- **Exit plan**: switch to Nebula, ZeroTier, or self-hosted WireGuard

## Resend / Postmark (Email)

- **Purpose**: Transactional email
- **Shares**: email addresses, email content
- **Does NOT share**: business data
- **Data on Resend**: email addresses, message bodies, delivery status
- **Compliance**: GDPR-compliant, EU data residency available
- **Exit plan**: switch to Postmark, SES, or self-hosted SMTP

## GitHub (Source Control + CI)

- **Purpose**: Code, issues, CI
- **Shares**: source code (private)
- **Does NOT share**: customer data
- **Data on GitHub**: code, PRs, issues
- **Compliance**: SOC 2 Type II
- **Exit plan**: move to self-hosted Gitea

## Hetzner (Cloud VM)

- **Purpose**: Host the Cloud platform
- **Shares**: nothing (just hosts our software)
- **Data on Hetzner**: encrypted disk images (we hold the keys)
- **Compliance**: ISO 27001
- **Exit plan**: migrate to OVH, DigitalOcean, or AWS

## MinIO (Object Storage)

- **Purpose**: Encrypted backup blobs
- **Shares**: nothing (we self-host)
- **Data on MinIO**: encrypted blobs (we hold the keys)
- **Compliance**: same as our infra
- **Exit plan**: switch to S3, B2, or any S3-compatible

## PostHog (Analytics, optional)

- **Purpose**: Anonymous product analytics
- **Shares**: anonymous event counts (no PII)
- **Does NOT share**: business data, user data
- **Data on PostHog**: click counts, page views, error rates
- **Compliance**: GDPR-compliant with EU data residency
- **Exit plan**: disable; or switch to Plausible / self-hosted Umami

## Sentry (Error Tracking, optional)

- **Purpose**: Crash reporting
- **Shares**: stack traces, app version, OS, no PII
- **Does NOT share**: business data
- **Data on Sentry**: error events
- **Compliance**: SOC 2 Type II
- **Exit plan**: disable; or self-hosted GlitchTip

## Cloudflare (DNS + CDN)

- **Purpose**: DNS, DDoS protection, CDN
- **Shares**: request metadata (IP, user agent)
- **Does NOT share**: business data
- **Data on Cloudflare**: access logs
- **Compliance**: SOC 2 Type II
- **Exit plan**: switch to Bunny.net, or self-hosted DNS
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/SERVICES.md || { echo "FAIL"; exit 1; }
grep -q "Stripe" docs/architecture/SERVICES.md || { echo "FAIL"; exit 1; }
echo "OK"
```
