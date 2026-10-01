# TASK ID: LAUNCH-035.1
# TITLE: Add: founder memo to the team at launch
# STATUS: pending
# DEPENDENCIES: LAUNCH-034.2
# ALLOWED FILES: docs/launch/TEAM-MEMO.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
A real note to the team. From the heart. Sets the tone for the post-launch weeks.

## REQUIRED IMPLEMENTATION

Create `docs/launch/TEAM-MEMO.md`:

```markdown
# Memo to the team — Day 0

Team,

We shipped.

I want to take a moment before we dive into the metrics and the support
queue to say: thank you.

Eighteen months ago, this was a sketch on a whiteboard. Some of you
joined a year ago, some six months ago, some last month. Every one of
you made this real.

We chose a hard path. Local-first. No internet required. Open source
clients. Triple-signed modules. Ed25519 audit chains. Argon2id. No
vendor lock-in. We said no to a hundred "easier" decisions because we
believed that customers' data should be their own.

The next 30 days will be loud. Customers will email. Bugs will appear.
Some competitors will copy us. Some journalists will misunderstand.
We'll all be tired.

Remember: we're not building a SaaS. We're building a tool. A tool
that respects its users. A tool that doesn't sell them. A tool that
works when the internet doesn't.

If a customer tells us we got it wrong, we listen. If they tell us
we got it right, we thank them. If we don't know, we ask.

In 6 months we'll have data. NPS. WAP. Churn. We'll have learned what
they actually want, not what we thought they wanted.

For now: be kind to each other. Be kind to our users. Be kind to
ourselves.

Let's go.

— [Founder name]

P.S. The first 100 customers get a hand-written thank-you note in the
mail. Don't @ me about the cost.
```

## TESTS

```bash
cd /workspace
test -f docs/launch/TEAM-MEMO.md || { echo "FAIL"; exit 1; }
grep -q "team" docs/launch/TEAM-MEMO.md || { echo "FAIL"; exit 1; }
echo "OK"
```
