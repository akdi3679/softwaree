# Vendor Security Review

Every external service or library we depend on is reviewed.

## Infrastructure

### Cloud host (Hetzner / OVH / DigitalOcean)
- **Purpose**: Run our Postgres + Hono API + MinIO.
- **Data**: Customer business data is NEVER on Cloud. Only auth, billing metadata, encrypted backup blobs.
- **Encryption at rest**: Provider-managed disk encryption.
- **Encryption in transit**: TLS 1.3 only.
- **Access**: SSH key-based; ops mesh only.
- **Review date**: 2026-01.
- **Risk**: Low. Provider is ISO 27001 certified.

### Discovery service (inside our Cloud)
- **Purpose**: Phone book for cross-network device reachability (see ADR-020).
- **Data**: IP metadata only; cannot decrypt user data.
- **Review date**: 2026-01.
- **Risk**: Very low.

### Stripe
- **Purpose**: Billing.
- **Data**: Customer name, email, payment method, invoices.
- **Compliance**: PCI DSS Level 1 (Stripe handles PAN).
- **Review date**: 2026-01.
- **Risk**: Low.

### Resend / Postmark (SMTP)
- **Purpose**: Transactional email (verification, backup alerts).
- **Data**: Email address, content.
- **Review date**: 2026-01.
- **Risk**: Low.

## Core libraries

| Library | License | Risk |
|---|---|---|
| Tauri 2.x | MIT/Apache-2.0 | Low |
| React 19 | MIT | Low |
| sqlx | MIT/Apache-2.0 | Low |
| ed25519-dalek | MIT/Apache-2.0 | Low |
| Wasmtime | Apache-2.0 | Low |
| Argon2 (rust-argon2) | MIT | Low |
| Drizzle | Apache-2.0 | Low |
| Hono | MIT | Low |
| postgres-js | Unlicense | Low |

## Review process for new dependencies

1. License: MIT / Apache-2.0 / BSD-2 / ISC only. GPL forbidden.
2. At least 1 release.
3. 100+ GitHub stars OR from a known org.
4. `cargo audit` / `pnpm audit` clean of high vulns.
5. Documented in docs/compliance/DEPENDENCIES.md.