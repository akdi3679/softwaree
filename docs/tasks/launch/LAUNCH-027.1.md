# TASK ID: LAUNCH-027.1
# TITLE: Add: customer support training manual
# STATUS: pending
# DEPENDENCIES: LAUNCH-026.2
# ALLOWED FILES: docs/support/TRAINING.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Quick reference for the support team.

## REQUIRED IMPLEMENTATION

Create `docs/support/TRAINING.md`:

```markdown
# Customer Support Training

## You're the first line

When a customer emails, they're trusting you to help. Your job is to
make them feel heard, get the facts, and route to the right person.

## Tone

- Friendly, never defensive
- Use their name
- Apologize for the inconvenience (even if it's not our fault)
- Plain language; no jargon
- Show you understand their context (clinic, lab, etc.)

## Response time SLA

- **Starter**: 48h
- **Team**: 24h
- **Enterprise**: 4h
- **Urgent (any plan)**: 1h during business hours

## Common questions

### "Where is my data?"

> Your data is on your Admin computer. We have encrypted backups in our
> Cloud that only you can decrypt. You can verify this at
> Settings → Backups.

### "How do I add a user?"

> Settings → Users → Invite. They'll get an email with a link. They need
> to have our mesh client installed too.

### "How do I replace my Admin?"

> Settings → Device → Replace. The new computer will need a code we'll
> email you. The old one is auto-revoked.

### "Can I get a copy of my data?"

> Yes. Settings → Data → Export. You'll get a ZIP with everything.

### "The app is slow."

Ask:
1. How many events in their project? (Settings → Database)
2. How much free disk? (Settings → System)
3. Are they on battery saver? (disable it)
4. Restart the app.

### "I lost my password."

> No problem. Go to https://portal.example.com/forgot — we email a reset
> link. If you also have TOTP enabled, you'll need a backup code.

## Escalation

| Severity | Route |
|---|---|
| Cannot use product at all | Page on-call: PagerDuty / Slack #incidents |
| Lost data | Page on-call |
| Billing question | #billing channel |
| Feature request | File as issue, add to roadmap backlog |
| Complaint about support | Forward to founder |
| Legal / GDPR | Forward to legal@example.com |

## Tools

- `support-cli` (in `tools/support-cli/`) — search users, projects, audit
- Cloud console (internal) — suspend/restore, see logs
- `customers/{company}.md` — every customer has a private file with
  their history

## Anti-patterns

❌ "Have you tried restarting?" (when they already said they did)
❌ "That's a known issue" (without linking the issue)
❌ "I'll get back to you next week" (be specific: "by Friday 5pm UTC")
❌ "Per our policy..." (we have no policies that need quoting)
❌ Forwarding to engineering without context (engineer should be able to reproduce in <10 min)

## How to get promoted

1. Reply fast
2. Solve on first contact
3. Document root cause (file a postmortem for SEV-1)
4. Suggest improvements to the product
5. Train new support hires
```

## TESTS

```bash
cd /workspace
test -f docs/support/TRAINING.md || { echo "FAIL"; exit 1; }
grep -q "SLA" docs/support/TRAINING.md || { echo "FAIL"; exit 1; }
echo "OK"
```
