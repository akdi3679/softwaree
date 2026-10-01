# TASK ID: MARKETPLACE-001.3
# TITLE: Add marketplace docs (publisher guide + customer guide)
# STATUS: pending
# DEPENDENCIES: MARKETPLACE-001.2
# ALLOWED FILES: /workspace/docs/marketplace/PUBLISHER.md, /workspace/docs/marketplace/CUSTOMER.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Document how third-party developers publish modules and how customers install them.

## REQUIRED IMPLEMENTATION

Create `/workspace/docs/marketplace/PUBLISHER.md`:

```markdown
# Publisher guide

How to build and publish a module to the marketplace.

## Prerequisites

- Rust toolchain (1.75+)
- `wasm32-wasip2` target: `rustup target add wasm32-wasip2`
- `product-publisher-cli` (download from `https://product.local/publisher`)
- A publisher account (register at `https://product.local/publishers/register`)

## Build

```bash
# 1. Create a new module
cargo new --lib my-module
cd my-module

# 2. Add the SDK
cargo add product-module-sdk

# 3. Implement the WIT interface
# 4. Build
cargo build --target wasm32-wasip2 --release

# Output: target/wasm32-wasip2/release/my_module.wasm
```

## Submit

```bash
product-publisher-cli publish \
  --manifest ./manifest.json \
  --binary ./target/wasm32-wasip2/release/my_module.wasm \
  --screenshots ./screenshot-1.png ./screenshot-2.png \
  --category medical
```

## Review

After submission:
1. Automated security review (runs in 5 minutes)
2. Manual review by the marketplace team (1-3 business days)
3. Email notification when approved/rejected
4. If approved, your module appears in the marketplace within 24 hours

## Pricing

- Free: $0
- Paid: $1 - $999 per project, per month
- Enterprise: contact sales

We take a 30% cut. Payouts monthly via Stripe.

## Required permissions

When you build a module, declare the permissions it needs:
- `patients.read` / `patients.write` (medical-reception)
- `samples.read` / `samples.write` (food-lab)
- `audit.read` (read the audit log)
- `project.meta.read` (read project metadata)

If you need a permission that doesn't exist, file a request via the publisher dashboard.

## Rules

- Modules cannot read other modules' data.
- Modules cannot make network calls.
- Modules cannot fork.
- Modules cannot read files outside their sandbox.
- All your module's actions are audited.

Violations: module is unpublished, publisher account is suspended.
```

Create `/workspace/docs/marketplace/CUSTOMER.md`:

```markdown
# Marketplace guide

How to find, install, and manage modules in your project.

## Browse

- In the Admin: **Modules → Available**
- Web: `https://product.local/marketplace`

Modules are categorized:
- Medical
- Food Lab
- Retail
- Service
- Industrial
- Other

## Install

1. Find a module
2. Click "Install"
3. Read the permissions it needs
4. Click "Confirm"
5. The module is downloaded, verified, and installed

The install takes 5-30 seconds depending on size.

## Manage

In **Modules → Installed**:
- View installed modules
- Update to a new version
- Uninstall (this emits a `module.uninstalled` event)
- View usage stats (calls per day, errors)

## Billing

If the module is paid:
- Charged to the project owner's account
- Listed in your monthly invoice
- Pro-rated for partial months
- Cancel anytime (we won't bill for the next month)

## Trust

Every module is:
1. **Triple-signed** by the Cloud at publish time
2. **Reviewed** by a human before becoming public
3. **Sandboxed** at runtime (no network, no ambient I/O)
4. **Audited** (every action is logged)
5. **Versioned** (you choose when to update)

If a module misbehaves:
1. Go to **Modules → Installed**
2. Click **Uninstall**
3. The audit log shows what it did
4. Report to `abuse@product.local`

## Custom modules

Enterprise customers can have private modules. See the Enterprise plan.
```

## TESTS

```bash
cd /workspace
test -f docs/marketplace/PUBLISHER.md || { echo "FAIL"; exit 1; }
test -f docs/marketplace/CUSTOMER.md || { echo "FAIL: no customer"; exit 1; }
grep -q "Publisher" docs/marketplace/PUBLISHER.md || { echo "FAIL"; exit 1; }
echo "OK"
```
