import nodemailer from "nodemailer";
import { renderTemplate } from "./templates";

const SMTP_HOST = process.env.SMTP_HOST ?? "";
const SMTP_PORT = Number.parseInt(process.env.SMTP_PORT ?? "587", 10);
const SMTP_USER = process.env.SMTP_USER ?? "";
const SMTP_PASS = process.env.SMTP_PASS ?? "";
const FROM_ADDRESS = process.env.FROM_ADDRESS ?? "noreply@product.local";
const FROM_NAME = process.env.FROM_NAME ?? "Product";

export const SMTP_ENABLED = SMTP_HOST.length > 0;

export const transporter = SMTP_ENABLED
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    })
  : null;

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail(msg: EmailMessage): Promise<{ messageId: string }> {
  if (!transporter) {
    console.log(`[email] SMTP disabled; would send to ${msg.to}: ${msg.subject}`);
    return { messageId: `disabled-${Date.now()}` };
  }
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
  const base = process.env.PUBLIC_URL ?? "https://product.local";
  const verifyUrl = `${base}/verify?token=${token}`;
  const { subject, text, html } = renderTemplate("verify_email", { verifyUrl });
  return sendEmail({ to, subject, text, html });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const base = process.env.PUBLIC_URL ?? "https://product.local";
  const resetUrl = `${base}/reset?token=${token}`;
  const { subject, text, html } = renderTemplate("password_reset", { resetUrl });
  return sendEmail({ to, subject, text, html });
}

export async function sendInvitationEmail(
  to: string,
  inviterName: string,
  projectName: string,
  token: string,
) {
  const base = process.env.PUBLIC_URL ?? "https://product.local";
  const acceptUrl = `${base}/invite/${token}`;
  const { subject, text, html } = renderTemplate("invitation", {
    inviterName,
    projectName,
    acceptUrl,
  });
  return sendEmail({ to, subject, text, html });
}