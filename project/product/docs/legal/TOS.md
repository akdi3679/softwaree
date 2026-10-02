# Terms of Service - TEMPLATE

> **Status:** TEMPLATE. Must be reviewed by a lawyer before use.
> **Placeholders** in `<angle brackets>` must be filled in.

---

## 1. Who we are

The Service is provided by `<LEGAL_ENTITY_NAME>` ("we", "us", "our"),
registered in `<JURISDICTION>` under company number `<NUMBER>`, with
its registered office at `<ADDRESS>`.

## 2. The Service

We provide a desktop software platform ("the Platform") consisting of
an Admin application, a User application, and a Cloud control plane
that facilitates device registration, project provisioning, module
licensing, encrypted backups, and updates.

The Platform is **local-first**: business data is stored on the customer's
own devices. We do not have access to your business data in plaintext.

## 3. Your account

You are responsible for:

- Keeping your account credentials secure.
- Ensuring that only authorized individuals use the Admin device.
- Ensuring the accuracy of the information you provide.

You must not:

- Share your account credentials.
- Use the Platform for any unlawful purpose.
- Attempt to reverse-engineer, decompile, or bypass the security of the
  Platform, except to the extent permitted by applicable law.
- Interfere with the Cloud control plane or other customers' access.

## 4. Plans and payment

Plans are described at `<PRICING_URL>`. Fees are billed in advance on a
`<BILLING_PERIOD>` basis. Fees are non-refundable except as required by
law or as stated in Section 5.

We may change prices with 30 days' notice. Continued use after the
notice period constitutes acceptance.

## 5. Cancellation and refunds

You may cancel at any time. Cancellation takes effect at the end of the
current billing period. Data on your Admin device remains yours; we will
keep your Cloud control-plane data for `<RETENTION_DAYS>` days after
cancellation, then delete it.

Refunds: `<REFUND_POLICY>`.

## 6. Data protection

We process personal data as described in our Privacy Notice
(`<PRIVACY_URL>`). For customer business data (including patient data),
you are the data controller and we are not a processor of that data,
because we do not have access to it in plaintext.

The Cloud control plane stores:

- Account identity (email, name, hashed password)
- Device public keys
- Project metadata (name, business type, admin last name)
- Encrypted backup blobs (which we cannot decrypt)
- Audit hashes (which do not contain personal data)
- Discovery metadata (device public IP, current port)

We do not store patient names, lab results, or any other business data
in plaintext.

## 7. Backups

If your plan includes Cloud backups, we store encrypted backups you
upload. We cannot decrypt them without your project recovery key. If
you lose the recovery key, backups may be unrecoverable.

## 8. Service levels

We aim for 99.5% monthly uptime for the Cloud control plane. This does
not cover:

- Admin or User app unavailability (runs on your device)
- Network failures between your devices
- Scheduled maintenance announced at least 24 hours in advance

If we fail the target, your remedy is a service credit as described in
`<SLA_URL>`. This is your sole remedy for unavailability.

## 9. Intellectual property

We retain all rights to the Platform and the Cloud. You retain all
rights to your data.

## 10. Module licensing

Business modules are licensed, not sold. Licenses are bound to your
project and plan. You may not redistribute modules.

## 11. Warranty disclaimer

THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE, AND NON-INFRINGEMENT. We do not warrant that the
Platform will be error-free or uninterrupted.

## 12. Limitation of liability

To the maximum extent permitted by law, our aggregate liability for any
claim arising out of or relating to these Terms is limited to the fees
you paid in the 12 months preceding the claim.

We are not liable for indirect, incidental, special, consequential, or
punitive damages, or for lost profits, revenue, or data.

## 13. Indemnification

You agree to indemnify us against any claim arising from your use of
the Platform in violation of these Terms or applicable law.

## 14. Governing law

These Terms are governed by the laws of `<JURISDICTION>`. Disputes are
resolved in the courts of `<VENUE>`.

## 15. Changes to these Terms

We may modify these Terms with 30 days' notice. Continued use after the
notice period constitutes acceptance. If you do not agree, your remedy
is to stop using the Platform.

## 16. Contact

`<CONTACT_EMAIL>`