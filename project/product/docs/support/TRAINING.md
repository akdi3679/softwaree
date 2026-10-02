# Customer Support Training

## You are the first line

When a customer emails, they are trusting you to help. Your job: make them feel heard, get the facts, and route to the right person.

## Tone

- Friendly, never defensive
- Use their name
- Apologize for the inconvenience (even if it is not our fault)
- Plain language; no jargon
- Show you understand their context (clinic, lab, etc.)

## Response time SLA

- Starter: 48h
- Team: 24h
- Enterprise: 4h
- Urgent (any plan): 1h during business hours

## Common questions

### Where is my data?
Your data is on your Admin computer. We have encrypted backups in our Cloud that only you can decrypt. You can verify this at Settings, Backups.

### How do I add a user?
Settings, Users, Invite. They get an email with a link. They need to have our mesh client installed too.

### How do I replace my Admin?
Settings, Device, Replace. The new computer needs a code we email you. The old one is auto-revoked.

### Can I get a copy of my data?
Yes. Settings, Data, Export. You get a ZIP with everything.

### The app is slow.
Ask:
1. How many events in their project? (Settings, Database)
2. How much free disk? (Settings, System)
3. Are they on battery saver? (disable it)
4. Restart the app.

### I lost my password.
No problem. Go to https://portal.example.com/forgot - we email a reset link. If you also have TOTP enabled, you need a backup code.

## Escalation

| Severity | Route |
|---|---|
| Cannot use product at all | Page on-call: PagerDuty / Slack #incidents |
| Lost data | Page on-call |
| Billing question | #billing channel |
| Feature request | File as issue, add to roadmap backlog |
| Complaint about support | Forward to founder |
| Legal or GDPR | Forward to legal@example.com |

## Tools

- support-cli (in tools/support-cli) - search users, projects, audit
- Cloud console (internal) - suspend/restore, see logs
- customers/{company}.md - every customer has a private file with their history

## Anti-patterns

- Have you tried restarting? (when they already said they did)
- That is a known issue (without linking the issue)
- I will get back to you next week (be specific: by Friday 5pm UTC)
- Per our policy (we have no policies that need quoting)
- Forwarding to engineering without context (engineer should reproduce in under 10 min)

## How to get promoted

1. Reply fast
2. Solve on first contact
3. Document root cause (file a postmortem for SEV-1)
4. Suggest improvements to the product
5. Train new support hires