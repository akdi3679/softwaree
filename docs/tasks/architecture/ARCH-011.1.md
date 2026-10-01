# TASK ID: ARCH-011.1
# TITLE: Add architecture: explain it to my mom (customer-facing)
# STATUS: pending
# DEPENDENCIES: ARCH-010.2
# ALLOWED FILES: docs/architecture/CUSTOMER-EXPLAINER.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Plain English for non-technical customers.

## REQUIRED IMPLEMENTATION

Create `docs/architecture/CUSTOMER-EXPLAINER.md`:

```markdown
# How Product Works — For Our Customers

## What is Product?

Product is an app that helps your team record and share important
information at work — like patients at a clinic, samples at a food lab,
or members at a gym.

## The two parts: Admin and User

You install **Product Admin** on **one** computer in your office. This is
the main computer. It is the one that records everything.

You can install **Product User** on other computers, phones, and tablets
in your office. These can **see** everything the Admin records, but they
cannot change anything. They're like TVs showing the same game.

## Why is Admin on only one computer?

Because if two people tried to write at the same time, the information
could get mixed up. By having only one computer that writes, we make sure
nothing gets lost.

## What if my Admin computer breaks?

You can replace it. Product walks you through the steps: we email you a
code, you put it into the new computer, and the new computer becomes the
Admin. The old one stops working automatically.

## What if the internet goes down?

That's OK. The Admin keeps working. Users can see whatever was already
saved. When the internet comes back, everything syncs up.

## Is my data safe?

- Your data is on the Admin computer. It never leaves the building
  except for encrypted backups.
- We can't read your data. We don't have the password.
- The backups are stored on our servers, but they're encrypted. We can't
  read them either.
- Every change is signed by your Admin computer. If anyone tried to
  change your data, you could prove it.

## What if we lose power during a write?

We tested that. If the power goes out at just the wrong moment, the
write either happens completely or doesn't happen at all. You'll never
get half-saved data.

## How do backups work?

Once a day (or every 4 hours, on our more expensive plans), Product
makes a copy of all your data, encrypts it, and sends it to our servers.
Only you can decrypt it.

## Where do you store the backups?

On a server in Frankfurt, Germany. We chose Germany because the laws
there are very strict about data privacy.

## Can I export all my data?

Yes. At any time, click "Export" in the Admin app and you'll get a ZIP
file with everything: all records, all events, all files. You can open
it on any computer.

## Can I delete everything?

Yes. Click "Delete project" in the Admin app. We give you 30 days to
change your mind, and then everything is gone — from your computer AND
from our servers.

## How is this different from a website?

The biggest difference: **you can use Product without the internet**.
If our servers are down, your team can still work. That never happens
with a website.

## I have more questions.

Email support@example.com. We respond within 24 hours, Monday through
Friday.
```

## TESTS

```bash
cd /workspace
test -f docs/architecture/CUSTOMER-EXPLAINER.md || { echo "FAIL"; exit 1; }
grep -q "Admin" docs/architecture/CUSTOMER-EXPLAINER.md || { echo "FAIL"; exit 1; }
echo "OK"
```
