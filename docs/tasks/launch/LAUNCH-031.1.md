# TASK ID: LAUNCH-031.1
# TITLE: Add: launch announcement blog post
# STATUS: pending
# DEPENDENCIES: LAUNCH-030.2
# ALLOWED FILES: marketing/blog/2026-08-15-launch.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Launch day blog post. Honest, not hype-y.

## REQUIRED IMPLEMENTATION

Create `marketing/blog/2026-08-15-launch.md`:

```markdown
---
title: "Product is live: local-first, open source, works offline"
date: 2026-08-15
author: The Product team
---

Today, after 18 months of building, we are launching **Product** — a
local-first platform for clinics, food labs, gyms, and other small
organizations.

## Why we built it

A small clinic's data is their most valuable asset. Patient records,
lab results, prescriptions — they don't belong on someone else's server.

But until now, the only options were:
- A SaaS app (you trust a vendor with your data)
- A paper system (no analytics, no backup)
- A custom app (expensive, hard to maintain)

Product is a different choice. **Your data lives on your Admin computer.**
We provide the Cloud for auth, billing, and encrypted backups — but we
can't read your data. We never could.

## What it does

Today, v1 ships with:

- **Admin app** — the one computer that holds the keys
- **User app** — read-only views for your team (over our WireGuard mesh)
- **medical-reception module** — patients, appointments, visits, prescriptions
- **food-lab module** — samples, chain of custody, lab reports
- **Marketplace** — install verified modules (gym, school, retail, hotel, restaurant, invoice)
- **Encrypted backups** — to our Cloud (Frankfurt), every day (or week, depending on plan)
- **Audit log** — every change signed, tamper-evident

## What's free

- The clients (Admin, User, modules) are MIT/Apache-2.0
- Run them yourself, fork them, modify them
- Our Cloud is the only paid part (and you can self-host it too)

## Pricing

- **Local**: $0 forever — one computer, no users, no backups
- **Starter**: $29/mo — 1 project, 3 users, weekly backups
- **Team**: $99/mo — 5 projects, 10 users, daily backups, priority support
- **Enterprise**: $499+/mo — unlimited, custom modules, SSO

## What you should do

1. **Sign up** at https://portal.example.com
2. **Download** the Admin for your computer
3. **Walk through** the 5-minute setup
4. **Add your first record**
5. **Invite** a colleague (they need our mesh client)

## What's next

We have a 12-month roadmap published. The big items:
- Real-time collaboration (Q4 2026)
- SOC 2 Type II (Q1 2027)
- iOS + Android native (Q2 2027)
- Multi-Admin per project (v2, 2028)

## How to reach us

- Email: hello@example.com
- Slack: [link]
- Issues: github.com/example/product

Thanks for reading. We're excited to see what you build.

— The Product team
```

## TESTS

```bash
cd /workspace
test -f marketing/blog/2026-08-15-launch.md || { echo "FAIL"; exit 1; }
grep -q "launch" marketing/blog/2026-08-15-launch.md || { echo "FAIL"; exit 1; }
echo "OK"
```
