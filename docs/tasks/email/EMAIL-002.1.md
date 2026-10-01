# TASK ID: EMAIL-002.1
# TITLE: Add email: backup-failed notification template
# STATUS: pending
# DEPENDENCIES: ADMIN-017.2
# ALLOWED FILES: platform-cloud/email/templates/backup-failed.tsx
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
React Email template for backup failure.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/email/templates/backup-failed.tsx`:

```typescript
import { Html, Head, Body, Container, Heading, Text, Section, Button, Hr } from '@react-email/components';

export function BackupFailedEmail(props: { project_name: string; failed_at: string; error: string; project_id: string }) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#f6f9fc' }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: 20, backgroundColor: 'white' }}>
          <Heading style={{ color: '#dc2626' }}>⚠ Backup failed for {props.project_name}</Heading>
          <Section>
            <Text>A scheduled backup failed at {props.failed_at}.</Text>
            <Text style={{ backgroundColor: '#fef2f2', padding: 12, borderRadius: 4 }}>
              <strong>Error:</strong> {props.error}
            </Text>
            <Text>Your data is still safe on your Admin device, but if your device fails before the next backup, you may lose data. Please check the Admin app logs.</Text>
            <Button href={`https://portal.example.com/projects/${props.project_id}/backups`} style={{ backgroundColor: '#2563eb', color: 'white', padding: '10px 20px', borderRadius: 4 }}>
              View backup history
            </Button>
          </Section>
          <Hr />
          <Text style={{ color: '#6b7280', fontSize: 12 }}>This is an automated message from Product.</Text>
        </Container>
      </Body>
    </Html>
  );
}
```

## TESTS

```bash
cd platform-cloud
test -f email/templates/backup-failed.tsx || { echo "FAIL"; exit 1; }
grep -q "BackupFailedEmail" email/templates/backup-failed.tsx || { echo "FAIL"; exit 1; }
echo "OK"
```
