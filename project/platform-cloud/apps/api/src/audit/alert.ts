// Simple alert dispatcher for security events.
//
// In production this would hit Slack + email. For now it logs, and reads
// env vars for the actual endpoints so we can wire them without code change.

export interface TamperAlert {
  projectId: string;
  tamperedSequence: number;
  detectedBy: string;
}

export async function alertTamperingDetected(opts: TamperAlert) {
  const message =
    "[SECURITY] TAMPERING DETECTED\\n" +
    "Project: " + opts.projectId + "\\n" +
    "Tampered at: " + opts.tamperedSequence + "\\n" +
    "Detected by: " + opts.detectedBy + "\\n" +
    "Time: " + new Date().toISOString();

  console.error(message);

  const slackWebhook = process.env.SLACK_SECURITY_WEBHOOK;
  if (slackWebhook) {
    try {
      await fetch(slackWebhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: message }),
      });
    } catch (e) {
      console.error("[audit] slack alert failed", e);
    }
  }

  const emailTo = process.env.SECURITY_EMAIL_TO;
  const emailEndpoint = process.env.EMAIL_ENDPOINT;
  if (emailTo && emailEndpoint) {
    try {
      await fetch(emailEndpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          to: emailTo,
          subject: "Tampering detected",
          text: message,
        }),
      });
    } catch (e) {
      console.error("[audit] email alert failed", e);
    }
  }
}
