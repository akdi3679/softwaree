# TASK ID: AUDIT-003.2
# TITLE: Add audit — alert webhook
# STATUS: pending
# DEPENDENCIES: AUDIT-003.1
# ALLOWED FILES: platform-cloud/audit/alert.ts
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
When tampering is detected, notify ops via Slack/email.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/audit/alert.ts`:

```typescript
import { sendSlackMessage } from '../notifications/slack';
import { sendEmail } from '../email/sender';

export async function alertTamperingDetected(opts: {
  projectId: string;
  tamperedSequence: number;
  detectedBy: string;  // user agent or device id
}) {
  const message = `🚨 TAMPERING DETECTED 🚨\n` +
    `Project: ${opts.projectId}\n` +
    `Tampered at sequence: ${opts.tamperedSequence}\n` +
    `Detected by: ${opts.detectedBy}\n` +
    `Time: ${new Date().toISOString()}`;
  await sendSlackMessage('#security-alerts', message);
  await sendEmail('ops@example.com', '🚨 TAMPERING DETECTED', message);
}
```

## TESTS

```bash
cd platform-cloud
test -f audit/alert.ts || { echo "FAIL"; exit 1; }
grep -q "alertTamperingDetected" audit/alert.ts || { echo "FAIL"; exit 1; }
echo "OK"
```
