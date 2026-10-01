# TASK ID: AUDIT-028.1
# TITLE: Self-audit fix #24: runbook for "customer has no internet"
# STATUS: pending
# DEPENDENCIES: AUDIT-027.2
# ALLOWED FILES: docs/runbooks/NO-INTERNET.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
The architecture supports no-internet operation. The runbook should
explain to support: what works, what doesn't, how to help.

## WHY THIS WAS FOUND IN SELF-AUDIT (user feedback)
The user explicitly mentioned "may our users have no internet". The
spec supports this (Local plan, LAN mode), but there's no runbook
for support to handle these customers.

## REQUIRED IMPLEMENTATION

Create `docs/runbooks/NO-INTERNET.md`:

```markdown
# Runbook: Customer With No Internet

## When to use this runbook

A customer reports they cannot connect to the internet, or they're
in an environment with no internet. Common cases:
- Clinic in a developing country
- Food lab in a remote area
- Hospital basement
- Industrial facility with air-gapped network
- Customer values privacy above all

## What still works

These things work 100% offline:

1. **Admin app** — local project, local SQLite, all features
2. **User app** — connects to Admin over LAN (mDNS + WireGuard)
3. **Local backups** — to USB drive or local network drive
4. **Modules** — installed locally, run locally
5. **Audit log** — local, append-only, hash-chained
6. **All commands** — recorded locally, replayed when online (v2)

## What doesn't work

These require internet:

1. **Cloud backups** — they're in our Cloud (we can't reach without internet)
2. **Account/billing** — Stripe needs internet
3. **Module marketplace** — downloads need internet (but already-installed work)
4. **Updates** — need internet to download new versions
5. **Support** — they email us, we email back (or use offline form)
6. **Multi-site sync** — if Admin is at site A and User is at site B
   (different networks, no internet between them), no sync

## How to help the customer

### Step 1: Confirm they're on Local plan
- They may have a paid plan, but be in an offline environment
- That's fine, the paid features gracefully degrade
- They keep their plan; we don't downgrade

### Step 2: Walk through offline setup

If they're starting from scratch with no internet:

1. **Download Admin + modules at a place with internet**
   - We provide a "bundle" download that includes:
     - Admin binary
     - All modules
     - All dependencies
   - They can put it on a USB drive and walk it over

2. **Install on their offline Admin computer**
   - Plug in USB
   - Run the installer
   - Done — no internet needed for install

3. **Set up local backups**
   - Settings → Backups → "Backup to: local drive"
   - Choose a USB drive or NAS
   - Schedule: daily
   - Verification: enabled
   - All without internet

4. **Connect Users on the same LAN**
   - User app: same WiFi, auto-discovers Admin
   - If auto-discovery fails, manual IP entry (Admin's local IP)

5. **Document the data flow**
   - "Your data is on the Admin computer"
   - "Backups are on the USB drive"
   - "Updates: download at any internet-connected place, walk USB over"

### Step 3: Set expectations

- "Updates will lag behind by however long between internet visits"
- "We can't see your data (that's the point, and it still works offline)"
- "If you lose the Admin computer, recover from the USB backup"
- "If you lose BOTH the Admin and the USB, you lose data — we have no copy"
  (this is the trade-off of no-Cloud-backup)

### Step 4: Schedule periodic check-ins

For these customers, set up:
- Monthly call: "still happy? any issues?"
- Quarterly: in-person visit if possible
- Annual: review the offline workflow, suggest improvements

## What we offer for offline customers

### Free
- Offline bundle download (one big file with everything)
- Email support (they batch questions when online)
- Annual onsite check-in (for Enterprise)

### Paid add-ons
- Annual onsite visit ($500-2000 + travel)
- Priority phone support (call from any phone, no internet needed)
- Loaner laptop pre-configured for offline use ($200/mo)
- Extra USB drives / NAS devices (we ship)

## Edge cases

### "I want to sync data between two offline sites"
- E.g., clinic in city + satellite clinic in remote area, neither has internet
- Options:
  1. Customer manually carries USB between sites, copies database
  2. Set up a long-range radio link (we can advise, but not our product)
  3. Wait for one site to get internet (cheaper)
- v2: support for "sneakernet sync" — incremental copies on USB

### "I have internet sometimes, but it's flaky"
- Sync is automatic; data flows when internet is up
- App shows "Last sync: 3 hours ago" if flaky
- Backups queue up and send when stable
- This is the same as any flaky-network customer

### "I want to switch to online later"
- Click "Activate Cloud" in Settings
- Local data uploads to Cloud (encrypted)
- Backups become automatic
- No data loss, no re-setup

## Metrics to track

- How many customers are offline-only?
- How long do they stay offline-only?
- What's their NPS (since they can't easily chat)?
- Do they upgrade to online later?
- What's their biggest pain point?

## When to revisit

- If 50+ customers are offline-only, build a dedicated offline UI
- If customers ask for sneakernet sync (USB-based), add to v2
- If the privacy-maximalist market grows, we may offer "Local Plus" plan
```

## TESTS

```bash
cd /workspace
test -f docs/runbooks/NO-INTERNET.md || { echo "FAIL"; exit 1; }
grep -q "no internet" docs/runbooks/NO-INTERNET.md || { echo "FAIL"; exit 1; }
echo "OK"
```
