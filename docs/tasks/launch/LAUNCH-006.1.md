# TASK ID: LAUNCH-006.1
# TITLE: Add legal templates (ToS, Privacy, DPA, License)
# STATUS: pending
# DEPENDENCIES: LAUNCH-005.2
# ALLOWED FILES: legal/terms-of-service.md, legal/privacy-policy.md, legal/data-processing-addendum.md, legal/LICENSE.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Boilerplate legal text. NOT legal advice — must be reviewed by a real lawyer.

## REQUIRED IMPLEMENTATION

Create `legal/terms-of-service.md`:

```markdown
# Terms of Service

**Effective date:** 2026-08-15
**Last updated:** 2026-08-15

> ⚠️ This is a template. Have a lawyer review before publishing.

## 1. Acceptance

By using Product, you agree to these terms.

## 2. The service

Product is a local-first platform. You install our Admin app on your computer. We provide Cloud services for auth, billing, and encrypted backups.

## 3. Your data

- Your data is on your computer. We don't have access to it.
- Backups are encrypted with a key only you hold. We cannot decrypt them.
- You own your data. Export it any time. Delete your account any time.

## 4. Your obligations

- Don't use Product for anything illegal.
- Don't try to break the service.
- Keep your account credentials safe.
- You're responsible for what your team does on the platform.

## 5. Our obligations

- We'll keep the service available 99.9% (Team plan and above).
- We'll protect your data per our Privacy Policy.
- We'll notify you of any breach within 72 hours.
- We won't sell your data.

## 6. Payment

- Subscription is monthly, in advance.
- You can cancel any time; we prorate.
- We don't store your payment card. Stripe does.

## 7. Termination

- You can delete your account any time. After 30 days, all data is permanently deleted.
- We can suspend your account for: non-payment, illegal activity, or breach of these terms.
- We'll notify you before any suspension if possible.

## 8. Liability

- The service is provided "as is".
- We're not liable for indirect damages.
- Our total liability is capped at 12 months of fees paid.

## 9. Changes

- We can update these terms with 30 days notice.
- If you don't agree, you can cancel before the changes take effect.

## 10. Contact

- Email: legal@example.com
- Address: [Your address]
```

Create `legal/privacy-policy.md`:

```markdown
# Privacy Policy

**Effective date:** 2026-08-15
**Last updated:** 2026-08-15

> ⚠️ Template. Review with a lawyer.

## What we collect

### Account data (Cloud)
- Email
- Password (hashed with Argon2id)
- Plan + billing info (via Stripe)
- IP address (for security)

### Audit data (Cloud)
- Who did what, when
- Used for security and support

### Your project data
- Stored on YOUR computer
- Encrypted backups stored on our Cloud (we cannot read them)

## What we DON'T collect

- Your business data
- Your customers' data
- Your content (notes, files, photos)

## How we use data

- Provide the service
- Detect abuse
- Comply with law
- Improve the product (only anonymous aggregates)

## Sub-processors

- Stripe (payments)
- Resend (email)
- Cloudflare (DNS, CDN)
- Hetzner (hosting)
- our WireGuard mesh (networking)

Full list: https://example.com/legal/subprocessors

## Your rights (GDPR / CCPA)

- Access: download all your data
- Rectify: change anything
- Delete: account deletion in 30 days
- Port: export to ZIP
- Object: opt out of analytics

## Cookies

We use a single first-party session cookie. No third-party tracking by default.

## Data residency

- EU customers: data stored in Frankfurt
- US customers: data stored in Virginia
- APAC customers: data stored in Singapore

## Security

- TLS 1.3 in transit
- AES-256-GCM at rest
- All access logged
- All backups encrypted with your key
- Annual pen-test

## Contact

- Email: privacy@example.com
- DPO: dpo@example.com
- Address: [Your address]
```

Create `legal/data-processing-addendum.md`:

```markdown
# Data Processing Addendum

This DPA supplements the Terms of Service. It applies to customers in the EU/EEA, UK, and Switzerland.

> ⚠️ Template. Have a lawyer review.

## 1. Definitions

- "Controller" = you (the customer)
- "Processor" = us (Example Co.)
- "Processing" = anything we do with Personal Data

## 2. Scope

We process Personal Data only:
- As documented in the ToS
- On your documented instructions
- As required by law

## 3. Sub-processors

See the sub-processor list. We notify you 30 days before adding a new one.

## 4. Security

We implement the security measures in `docs/architecture/SECURITY.md` (TOMLs).

## 5. Your rights

We help you fulfill data subject requests within 30 days.

## 6. Breach notification

We notify you within 72 hours of becoming aware of a breach.

## 7. Data transfers

EU/EEA/UK/CH data stays in EU/EEA unless you instruct otherwise. Standard Contractual Clauses apply for transfers to third countries.

## 8. Audit

You can audit us once per year, with 30 days notice. Or you can accept our SOC 2 report.

## 9. Return / deletion

On termination, we return or delete all Personal Data within 30 days.

## 10. Liability

Liability is unlimited for direct damages caused by our breach of this DPA, subject to the ToS cap.
```

Create `legal/LICENSE.md`:

```markdown
# End-User License Agreement (EULA)

> ⚠️ Template. Review with a lawyer.

## Grant

We grant you a non-exclusive, non-transferable license to use the Product software.

## Permitted

- Install on your computers
- Use for your business
- Modify for your own use (open source components)

## Not permitted

- Resell the software
- Reverse engineer to clone it
- Use to build a competing product
- Remove copyright notices

## Open source

Components under MIT/Apache-2.0 retain their licenses. See:
- Tauri (MIT)
- React (MIT)
- sqlx (MIT/Apache-2.0)
- Wasmtime (Apache-2.0)

## Updates

We may push updates. You're not required to install them, but old versions may stop working.

## Disclaimers

The software is provided "as is" without warranty of any kind.
```

## TESTS

```bash
cd /workspace
test -f legal/terms-of-service.md || { echo "FAIL"; exit 1; }
test -f legal/privacy-policy.md || { echo "FAIL: no privacy"; exit 1; }
test -f legal/data-processing-addendum.md || { echo "FAIL: no dpa"; exit 1; }
test -f legal/LICENSE.md || { echo "FAIL: no license"; exit 1; }
echo "OK"
```
