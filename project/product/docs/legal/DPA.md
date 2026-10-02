# Data Processing Agreement - TEMPLATE

> **Status:** TEMPLATE. Must be reviewed by a lawyer before use.
> **Placeholders** in `<angle brackets>` must be filled in.

---

## 1. Parties

This Data Processing Agreement ("DPA") is between:

- **Controller** (the customer): `<CUSTOMER_LEGAL_NAME>` ("Customer")
- **Processor** (us): `<LEGAL_ENTITY_NAME>` ("Provider")

This DPA is incorporated into and subject to the Terms of Service.

---

## 2. Scope

### 2.1 Provider as processor

The Provider processes the following categories of personal data on
behalf of the Customer:

- Customer's authorized users' account data (name, email, hashed password)
- Customer's device identities (public keys, role, display name)
- Customer's project metadata (project name, business type, admin name)
- Customer's encrypted backup blobs
- Discovery metadata (device public IPs, virtual IPs)

### 2.2 Provider NOT as processor for business data

The Provider does not process the Customer's business data (patient
records, lab results, etc.) because that data never leaves the Customer's
Admin device in plaintext. The Provider cannot access it.

If, in the future, this changes (e.g. through a new feature), the
Provider will update this DPA before the feature is enabled.

---

## 3. Processing instructions

The Provider processes the personal data only:

- To provide the Service as described in the Terms of Service.
- To comply with legal obligations.
- As documented in the Provider's Privacy Notice.

The Provider does not process the personal data for its own purposes.

---

## 4. Security measures

The Provider implements appropriate technical and organizational
measures, including:

- Encryption in transit (TLS 1.3) and at rest (AES-256).
- Argon2id for password hashing.
- Ed25519 for device keys.
- SHA-256 hash chains for audit integrity.
- Access controls limited to essential personnel.
- Regular penetration testing.
- Incident response procedures in `docs/runbooks/DR.md`.

---

## 5. Sub-processors

The Customer authorizes the Provider to engage the following
sub-processors:

| Sub-processor | Purpose | Location |
|---|---|---|
| `<HOSTING_PROVIDER>` | Cloud VM | `<REGION>` |
| `<STORAGE_PROVIDER>` | Backup blob storage | `<REGION>` |
| `<EMAIL_PROVIDER>` | Transactional email | `<REGION>` |
| `<PAYMENT_PROVIDER>` | Payment processing | `<REGION>` |

The Provider will give the Customer 30 days' notice before adding a
sub-processor.

---

## 6. Data subject rights

The Provider assists the Customer in responding to data subject
requests, to the extent the personal data is under the Provider's
control.

The Customer is responsible for requests relating to business data
(which is under the Customer's control, on the Admin device).

---

## 7. Data breach notification

The Provider notifies the Customer without undue delay (within 72 hours
of becoming aware) of any personal data breach affecting the Customer's
data.

The notification includes:

- Nature of the breach
- Categories and approximate number of data subjects affected
- Likely consequences
- Measures taken or proposed

---

## 8. Audit

Once per year, the Customer may request a compliance report from the
Provider. On-site audits require 30 days' notice and are limited to
one per year unless mandated by a supervisory authority.

---

## 9. Return or deletion of data

On termination, the Provider:

- Makes available all Customer personal data for export for 30 days.
- Deletes all Customer personal data after the export period, subject
  to legal retention requirements.

Business data is not affected (it lives on the Customer's devices).

---

## 10. International transfers

Data is stored in `<REGION>`. Transfers outside the EEA, if any, use
Standard Contractual Clauses (Module 2: Controller to Processor).

---

## 11. Liability

The parties' liability under this DPA is subject to the limitation of
liability in the Terms of Service.

---

## 12. Term

This DPA is effective on the date the Customer accepts the Terms of
Service and continues until all personal data has been deleted.

---

## 13. Signatures

For the Customer: `<CUSTOMER_SIG>`

For the Provider: `<PROVIDER_SIG>`