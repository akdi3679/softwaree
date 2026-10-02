export type TemplateName =
  | "verify_email"
  | "password_reset"
  | "invitation"
  | "backup_failed";

export interface RenderedTemplate {
  subject: string;
  text: string;
  html: string;
}

export function renderTemplate(
  name: TemplateName,
  vars: Record<string, string>,
): RenderedTemplate {
  switch (name) {
    case "verify_email":
      return {
        subject: "Verify your Product email",
        text: `Click this link to verify your email: ${vars.verifyUrl}`,
        html: `<p>Welcome to Product.</p><p>Click <a href="${vars.verifyUrl}">this link</a> to verify your email. The link expires in 24 hours.</p>`,
      };
    case "password_reset":
      return {
        subject: "Reset your Product password",
        text: `Click this link to reset your password: ${vars.resetUrl}`,
        html: `<p>You (or someone) requested a password reset.</p><p>If you didn't, ignore this email.</p><p>Otherwise, <a href="${vars.resetUrl}">click here</a> to set a new password. The link expires in 1 hour.</p>`,
      };
    case "invitation":
      return {
        subject: `${vars.inviterName} invited you to ${vars.projectName}`,
        text: `${vars.inviterName} invited you to join ${vars.projectName} on Product. Accept: ${vars.acceptUrl}`,
        html: `<p>${vars.inviterName} has invited you to join <strong>${vars.projectName}</strong> on Product.</p><p><a href="${vars.acceptUrl}">Accept invitation</a></p>`,
      };
    case "backup_failed":
      return {
        subject: `Backup failed for ${vars.projectName}`,
        text: `A scheduled backup failed for ${vars.projectName} at ${vars.failedAt}.\n\nError: ${vars.error}\n\nYour data is still safe on your Admin device, but if your device fails before the next backup, you may lose data. Please check the Admin app logs.`,
        html: `<h2 style="color:#dc2626">Backup failed for ${vars.projectName}</h2><p>A scheduled backup failed at ${vars.failedAt}.</p><p style="background:#fef2f2;padding:12px;border-radius:4px"><strong>Error:</strong> ${vars.error}</p><p>Your data is still safe on your Admin device, but if your device fails before the next backup, you may lose data.</p>`,
      };
  }
}