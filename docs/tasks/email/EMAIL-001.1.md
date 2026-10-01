# TASK ID: EMAIL-001.1
# TITLE: Add email send (SMTP + templates)
# STATUS: pending
# DEPENDENCIES: ONBOARD-001.3
# ALLOWED FILES: platform-cloud/src/email/send.ts, platform-cloud/src/email/templates.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
SMTP-based email sending with templates for verification, password reset, invitations.

## REQUIRED IMPLEMENTATION

Add to `package.json`:
```json
"dependencies": {
  "nodemailer": "^6.9.14"
}
```

Create `platform-cloud/src/email/send.ts`:

```typescript
import nodemailer from 'nodemailer';
import { renderTemplate } from './templates';

const SMTP_HOST = process.env.SMTP_HOST ?? '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? '587', 10);
const SMTP_USER = process.env.SMTP_USER ?? '';
const SMTP_PASS = process.env.SMTP_PASS ?? '';
const FROM_ADDRESS = process.env.FROM_ADDRESS ?? 'noreply@product.local';
const FROM_NAME = process.env.FROM_NAME ?? 'Product';

export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail(msg: EmailMessage): Promise<{ messageId: string }> {
  const result = await transporter.sendMail({
    from: `${FROM_NAME} <${FROM_ADDRESS}>`,
    to: msg.to,
    subject: msg.subject,
    text: msg.text,
    html: msg.html,
    replyTo: msg.replyTo,
  });
  return { messageId: result.messageId };
}

export async function sendVerificationEmail(to: string, token: string) {
  const verifyUrl = `${process.env.PUBLIC_URL ?? 'https://product.local'}/verify?token=${token}`;
  const { subject, text, html } = renderTemplate('verify_email', { verifyUrl });
  return sendEmail({ to, subject, text, html });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${process.env.PUBLIC_URL ?? 'https://product.local'}/reset?token=${token}`;
  const { subject, text, html } = renderTemplate('password_reset', { resetUrl });
  return sendEmail({ to, subject, text, html });
}

export async function sendInvitationEmail(to: string, inviterName: string, projectName: string, token: string) {
  const acceptUrl = `${process.env.PUBLIC_URL ?? 'https://product.local'}/invite/${token}`;
  const { subject, text, html } = renderTemplate('invitation', { inviterName, projectName, acceptUrl });
  return sendEmail({ to, subject, text, html });
}
```

Create `platform-cloud/src/email/templates.ts`:

```typescript
export type TemplateName = 'verify_email' | 'password_reset' | 'invitation';

export function renderTemplate(name: TemplateName, vars: Record<string, string>): { subject: string; text: string; html: string } {
  switch (name) {
    case 'verify_email':
      return {
        subject: 'Verify your Product email',
        text: `Click this link to verify your email: ${vars.verifyUrl}`,
        html: `<p>Welcome to Product.</p><p>Click <a href="${vars.verifyUrl}">this link</a> to verify your email. The link expires in 24 hours.</p>`,
      };
    case 'password_reset':
      return {
        subject: 'Reset your Product password',
        text: `Click this link to reset your password: ${vars.resetUrl}`,
        html: `<p>You (or someone) requested a password reset.</p><p>If you didn't, ignore this email.</p><p>Otherwise, <a href="${vars.resetUrl}">click here</a> to set a new password. The link expires in 1 hour.</p>`,
      };
    case 'invitation':
      return {
        subject: `${vars.inviterName} invited you to ${vars.projectName}`,
        text: `${vars.inviterName} invited you to join ${vars.projectName} on Product. Accept: ${vars.acceptUrl}`,
        html: `<p>${vars.inviterName} has invited you to join <strong>${vars.projectName}</strong> on Product.</p><p><a href="${vars.acceptUrl}">Accept invitation</a></p>`,
      };
  }
}
```

## TESTS

```bash
cd platform-cloud
test -f src/email/send.ts || { echo "FAIL"; exit 1; }
test -f src/email/templates.ts || { echo "FAIL: no templates"; exit 1; }
grep -q "nodemailer" package.json || { echo "FAIL: no nodemailer"; exit 1; }
pnpm typecheck > /dev/null 2>&1 || { echo "FAIL"; exit 1; }
echo "OK"
```
