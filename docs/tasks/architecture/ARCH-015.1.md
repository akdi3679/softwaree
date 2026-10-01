# TASK ID: ARCH-015.1
# TITLE: Add architecture: top 10 customer FAQs
# STATUS: pending
# DEPENDENCIES: ADMIN-043.2
# ALLOWED FILES: docs/FAQ.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
The 10 most common questions, answered.

## REQUIRED IMPLEMENTATION

Create `docs/FAQ.md`:

```markdown
# Top 10 Customer Questions

## 1. Where is my data?

Your data is on **your** Admin computer, in your office. It does not live
on our servers. The only data we have is what's needed to manage your
account (email, plan, billing) and encrypted backups of your project
(which we cannot read).

## 2. Can my staff use the app from home?

Yes, but with caveats:
- They need a our mesh client installed (free, ~5 minutes)
- They need to be on the same our mesh as your Admin
- If they don't have a our mesh account, they can use it on a phone via
  our mesh's SSO

## 3. Can I share with someone who isn't in my office?

Only if they have a our mesh account and you've added them as a user.
You cannot share with random people — this is a deliberate security
choice.

## 4. What if my Admin computer dies?

You can replace it. Go to **Settings → Device → Replace device** in your
new computer's Admin app. We email you a code; the old device is
automatically revoked. All your existing Users reconnect to the new
Admin.

## 5. Can I have two Admin computers?

Not in v1. v1 enforces one Admin per project for safety. v2 will support
multi-Admin with conflict resolution (planned Q1 2028).

## 6. How do I back up my data?

Backups happen automatically based on your plan:
- Starter: weekly
- Team: daily
- Enterprise: every 4 hours

You can also trigger a manual backup: **Settings → Backups → Backup now**.

## 7. Where are the backups stored?

On a server in Frankfurt, Germany. The backups are encrypted with a key
that only you have. We cannot read them.

## 8. Can I get a copy of my data?

Yes. Go to **Settings → Export data**. You'll get a ZIP file with
everything: all events, all records, all files.

## 9. Can I delete my account?

Yes. Go to **Settings → Account → Delete account**. We give you 30 days
to change your mind, then everything is permanently deleted from both
your computer and our servers.

## 10. How do I get help?

In the Admin app: **Help → Contact support**. We respond within 24 hours
on business days. For urgent issues, choose "Urgent" severity — those
page our on-call.
```

## TESTS

```bash
cd /workspace
test -f docs/FAQ.md || { echo "FAIL"; exit 1; }
grep -q "data" docs/FAQ.md || { echo "FAIL"; exit 1; }
echo "OK"
```
