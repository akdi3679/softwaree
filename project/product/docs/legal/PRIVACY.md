# Privacy Notice - TEMPLATE

> **Status:** TEMPLATE. Must be reviewed by a lawyer before use.
> **Placeholders** in `<angle brackets>` must be filled in.

---

## 1. Who we are

`<LEGAL_ENTITY_NAME>` ("we", "us", "our") is the data controller for the
personal data described in this notice.

Contact: `<DPO_CONTACT>`.

## 2. What we collect and why

### 2.1 Account data

- **Email address** - to identify your account and send essential
  communications (verification, password reset, invitations).
- **Display name** - to identify you to your teammates.
- **Password hash** - to authenticate you. We use Argon2id. We never
  store the plaintext password.

Legal basis: performance of contract (GDPR Art. 6(1)(b)).

### 2.2 Device data

- **Device public key** - to authenticate the device to the Cloud.
- **Device role** (Admin / User) - to enforce the platform's authority
  model.
- **Device display name** - to show your devices in the portal.

Legal basis: performance of contract.

### 2.3 Project metadata

- **Project name** - to identify the project to you.
- **Business type** (medical_reception / food_lab / other) - for support
  and module selection.
- **Admin last name** - to identify who is responsible for the project.

Legal basis: performance of contract.

### 2.4 Backup data

Encrypted backup blobs. We cannot decrypt these. If you authorize a
recovery event, we use your escrowed recovery key to assist - the
event is audited.

Legal basis: performance of contract.

### 2.5 Discovery metadata

- **Device current public IP** - to help devices find each other across
  networks. Retained for 7 days.
- **Device virtual IP** - stable identifier for the mesh.

Legal basis: legitimate interest (making the Service work). You can opt
out per project. See Section 5.

### 2.6 Logs

- **Request logs** - timestamp, path, status, correlation ID, account ID
  (when authenticated). Retained for 30 days.
- **Error logs** - same fields plus stack trace. Retained for 90 days.
- **Audit logs** - see Section 2.7.

Legal basis: legitimate interest (operating and securing the Service).

### 2.7 Audit logs

- **Platform audit** - who did what on the Cloud. Includes account ID,
  device ID, action, target, result, timestamp. Retained per the audit
  retention policy (see below).
- **Business audit** - stored on your Admin device, not on the Cloud.
  We receive hash-chained snapshots that prove integrity but do not
  contain the underlying data.

Legal basis: legal obligation (compliance), legitimate interest
(security).

## 3. What we do NOT collect

- Patient names, medical records, lab results, or any other business
  data in plaintext.
- Contents of sync traffic between Admin and User devices.
- Contents of messages you exchange with your team.
- Browser fingerprints or tracking identifiers beyond what is necessary
  for the Service.
- Data from third-party advertising or tracking SDKs.

## 4. Who we share data with

We share personal data with:

- **Hosting providers** - `<HOSTING_PROVIDER>` runs the Cloud VM.
- **Storage providers** - `<STORAGE_PROVIDER>` runs the backup store.
- **Email providers** - `<EMAIL_PROVIDER>` sends transactional email.
- **Payment processor** - `<PAYMENT_PROVIDER>` processes card payments.

Each is under a data processing agreement. A full list is in
`<SUBPROCESSORS_URL>`.

We do not sell your personal data.

## 5. Your choices

### 5.1 Discovery opt-out

You can disable the discovery service for a project. In that mode, your
devices never send heartbeats. Trade-off: cross-network sync only works
if you run your own relay or are on the same LAN.

### 5.2 Backup frequency

Depends on your plan. Local plan has no Cloud backup.

### 5.3 Data export

You can request a full export of your Cloud-side data at any time from
the portal. We deliver it within 30 days.

### 5.4 Account deletion

You can delete your account from the portal. We delete your account
data within 30 days, subject to legal retention requirements.

## 6. Your rights (GDPR / CCPA)

You have the right to:

- Access your personal data.
- Correct inaccurate data.
- Delete your data (subject to legal retention).
- Restrict processing.
- Data portability.
- Object to processing based on legitimate interest.
- Lodge a complaint with a supervisory authority.

Exercise these via the portal or by contacting `<DPO_CONTACT>`.

## 7. Retention

| Data | Retention |
|---|---|
| Account data | Until account deletion + 30 days |
| Session tokens | 30 days after issuance, or immediate on revocation |
| Device public keys | Until device revocation + 30 days |
| Discovery heartbeats | 7 days |
| Request logs | 30 days |
| Error logs | 90 days |
| Audit logs (Starter) | 1 year |
| Audit logs (Team) | 5 years |
| Audit logs (Enterprise) | Forever |
| Backup blobs | Per plan quota, until customer deletes |

## 8. Security

We use:

- Argon2id for password hashing
- Ed25519 for device keys
- SHA-256 hash chains for audit
- TLS 1.3 for all transport
- WireGuard for device-to-device mesh
- Secrets in Infisical, not in code

We undergo external penetration testing annually.

## 9. International transfers

Data is stored in `<REGION>`. Transfers outside the EEA, if any, use
Standard Contractual Clauses.

## 10. Children

The Service is not intended for use by anyone under 16. We do not
knowingly collect personal data from children.

## 11. Changes

We will notify you of material changes 30 days in advance.

## 12. Contact

`<DPO_CONTACT>`