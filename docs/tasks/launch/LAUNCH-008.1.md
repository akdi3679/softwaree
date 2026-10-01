# TASK ID: LAUNCH-008.1
# TITLE: Add first-customer onboarding script
# STATUS: pending
# DEPENDENCIES: LAUNCH-007.2
# ALLOWED FILES: docs/runbooks/FIRST-CUSTOMER.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Step-by-step script for onboarding the first paying customer. Used by support/sales.

## REQUIRED IMPLEMENTATION

Create `docs/runbooks/FIRST-CUSTOMER.md`:

```markdown
# First Customer Onboarding

The first 5 customers get a white-glove onboarding. After that, we expect them to self-serve.

## Before the call

- [ ] Read their signup form (industry, size, plan)
- [ ] Set up a 30-min call (Zoom, recorded with consent)
- [ ] Invite: their Admin, our onboarding engineer, our CEO
- [ ] Prepare a 1-page summary of their needs

## Call agenda (30 min)

### 5 min — Intro
- Who we are, what we built
- Why we built it (their problem)
- What to expect in 30 days

### 10 min — Their setup
- What computer will be Admin? (recommend Mac/PC with SSD, 8GB+ RAM)
- How many staff? What roles?
- Internet? Our mesh ready?

### 10 min — Plan
- Which plan fits
- Pricing, billing, invoices
- How to upgrade/downgrade

### 5 min — Schedule
- When we install the Admin (next day, 1-hour slot)
- When we train staff (1 hour, all in one call)

## Install session (1 hour, screen-shared)

- [ ] Download Admin (link)
- [ ] Sign in (we create the account)
- [ ] Create project
- [ ] Install module (medical-reception / food-lab / etc.)
- [ ] Add first record
- [ ] Add 1-2 users (invite by email)
- [ ] Verify they receive the invite
- [ ] Test sync (User app should see the record)
- [ ] Trigger a manual backup
- [ ] Show them the audit log
- [ ] Show them the settings page

## Training session (1 hour, recorded)

- Daily workflow (15 min)
  - "Here's how you add a patient / sample / member"
  - "Here's the search"
  - "Here's the report"
- Weekly (5 min)
  - "Check the audit log"
  - "Review the backup status"
- When something goes wrong (10 min)
  - Contact support
  - Use the diagnostic bundle
- Questions (30 min)

## After the call (within 24h)

- [ ] Send a recap email with: links, video recording, key contacts
- [ ] Add them to our customer Slack channel (private)
- [ ] Schedule a 30-day check-in
- [ ] Internal: file their info in /customers/{company}.md

## 30-day check-in

- [ ] Are they using it daily?
- [ ] Any pain points?
- [ ] NPS score
- [ ] Add a case-study testimonial (with permission)
- [ ] Offer them a discount for referring a friend

## Failure modes

### They don't use it after install
- Day 3: ping with quick-start video
- Day 7: 15-min call to walk through
- Day 14: escalation to founder
- Day 30: hard ask: "should we cancel?"

### They have a critical bug
- Within 1 hour: triage
- Within 4 hours: fix or workaround
- Within 24 hours: post-mortem

### They want to leave
- Within 24 hours: exit interview
- Within 7 days: data export
- Within 30 days: account deleted
- Internal: file the reason in /lost-customers/{company}.md
```

## TESTS

```bash
cd /workspace
test -f docs/runbooks/FIRST-CUSTOMER.md || { echo "FAIL"; exit 1; }
grep -q "Onboarding" docs/runbooks/FIRST-CUSTOMER.md || { echo "FAIL"; exit 1; }
echo "OK"
```
