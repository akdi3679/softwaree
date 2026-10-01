# TASK ID: LAUNCH-005.1
# TITLE: Add marketing site (one-page with signup)
# STATUS: pending
# DEPENDENCIES: LAUNCH-004.2
# ALLOWED FILES: marketing/index.html, marketing/styles.css, marketing/script.js
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
One-page site. Landing, pricing, signup form. Cloudflare Pages.

## REQUIRED IMPLEMENTATION

Create `marketing/index.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Product — Local-first platform for clinics, labs, and small teams</title>
  <meta name="description" content="Run your practice on your own computer. No internet required. Open source." />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header>
    <div class="nav">
      <strong>Product</strong>
      <nav>
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
        <a href="#faq">FAQ</a>
        <a href="https://portal.example.com/signup" class="btn-primary">Sign up</a>
      </nav>
    </div>
  </header>

  <main>
    <section class="hero">
      <h1>Your data. Your computer. Your practice.</h1>
      <p>Local-first platform for clinics, food labs, gyms, and schools. Works offline. Open source. No vendor lock-in.</p>
      <div class="cta">
        <a href="https://portal.example.com/signup" class="btn-primary">Start free</a>
        <a href="#how" class="btn-secondary">How it works</a>
      </div>
    </section>

    <section id="features">
      <h2>Why teams pick Product</h2>
      <div class="grid">
        <div class="card">
          <h3>🛡 Local-first</h3>
          <p>Your data lives on your computer. We can't read it. Cloud only handles auth + backups.</p>
        </div>
        <div class="card">
          <h3>📡 Works offline</h3>
          <p>The Admin keeps running without internet. Users see the latest data. When the internet's back, everything syncs.</p>
        </div>
        <div class="card">
          <h3>🔐 Triple-signed modules</h3>
          <p>Every module is cryptographically verified. Even if a publisher is compromised, the device decides what to trust.</p>
        </div>
        <div class="card">
          <h3>📋 Audit chain</h3>
          <p>Every change is signed. Tamper-evident. HIPAA & GDPR ready out of the box.</p>
        </div>
        <div class="card">
          <h3>🌍 i18n + RTL</h3>
          <p>English, Arabic, French. RTL built in. We translate, you don't have to.</p>
        </div>
        <div class="card">
          <h3>💬 Self-host or SaaS</h3>
          <p>Use our Cloud, or run your own. We don't lock you in.</p>
        </div>
      </div>
    </section>

    <section id="pricing">
      <h2>Simple pricing</h2>
      <div class="grid pricing">
        <div class="card">
          <h3>Local</h3>
          <p class="price">$0</p>
          <ul><li>1 computer, no users, no backups.</li><li>Good for solo practitioners.</li></ul>
          <a href="https://portal.example.com/signup?plan=local" class="btn-secondary">Get started</a>
        </div>
        <div class="card highlight">
          <h3>Starter</h3>
          <p class="price">$29<span>/mo</span></p>
          <ul><li>1 project, 3 users</li><li>Weekly encrypted backups</li><li>Marketplace access</li></ul>
          <a href="https://portal.example.com/signup?plan=starter" class="btn-primary">Start free trial</a>
        </div>
        <div class="card">
          <h3>Team</h3>
          <p class="price">$99<span>/mo</span></p>
          <ul><li>5 projects, 10 users</li><li>Daily backups</li><li>Priority support</li></ul>
          <a href="https://portal.example.com/signup?plan=team" class="btn-primary">Start free trial</a>
        </div>
        <div class="card">
          <h3>Enterprise</h3>
          <p class="price">$499+<span>/mo</span></p>
          <ul><li>Unlimited</li><li>4h backups</li><li>Custom modules + SSO</li></ul>
          <a href="mailto:sales@example.com" class="btn-secondary">Contact sales</a>
        </div>
      </div>
    </section>

    <section id="faq">
      <h2>FAQ</h2>
      <details><summary>Where is my data?</summary><p>On your Admin computer. Encrypted backups go to our Cloud (Frankfurt), but we can't read them.</p></details>
      <details><summary>What if my Admin dies?</summary><p>Replace it. Settings → Device → Replace. We email you a code. The old one is auto-revoked.</p></details>
      <details><summary>Can I export my data?</summary><p>Yes. Settings → Export. ZIP with everything.</p></details>
      <details><summary>Is it really free / open source?</summary><p>The clients (Admin, User, modules) are MIT/Apache-2.0. The Cloud is proprietary but trivially self-hostable from the open code.</p></details>
    </section>
  </main>

  <footer>
    <p>© 2026 Example Co. · <a href="/legal/privacy">Privacy</a> · <a href="/legal/tos">Terms</a> · <a href="mailto:hello@example.com">Contact</a></p>
  </footer>

  <script src="script.js"></script>
</body>
</html>
```

Create `marketing/styles.css`:

```css
* { box-sizing: border-box; }
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; background: #fff; }
.nav { max-width: 1100px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 1rem; }
.nav nav a { margin-left: 1.5rem; text-decoration: none; color: #4b5563; }
.btn-primary { background: #2563eb; color: white; padding: 0.5rem 1rem; border-radius: 6px; text-decoration: none; }
.btn-secondary { border: 1px solid #d1d5db; color: #111827; padding: 0.5rem 1rem; border-radius: 6px; text-decoration: none; }
.hero { text-align: center; padding: 4rem 1rem; background: linear-gradient(180deg, #eff6ff, #fff); }
.hero h1 { font-size: 3rem; margin: 0 0 1rem; }
.hero p { font-size: 1.25rem; color: #4b5563; max-width: 600px; margin: 0 auto 2rem; }
.cta { display: flex; gap: 1rem; justify-content: center; }
section { max-width: 1100px; margin: 4rem auto; padding: 0 1rem; }
section h2 { font-size: 2rem; margin-bottom: 2rem; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
.card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; }
.card.highlight { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
.card h3 { margin-top: 0; }
.price { font-size: 2rem; font-weight: 700; margin: 0.5rem 0; }
.card ul { padding-left: 1.2rem; color: #4b5563; }
footer { text-align: center; padding: 2rem; color: #6b7280; border-top: 1px solid #e5e7eb; }
```

Create `marketing/script.js`:

```javascript
// Track sign-up clicks for analytics
document.querySelectorAll('a[href*="signup"]').forEach(a => {
  a.addEventListener('click', () => {
    if (window.plausible) window.plausible('signup_click', { props: { plan: new URL(a.href).searchParams.get('plan') } });
  });
});
```

## TESTS

```bash
cd /workspace
test -f marketing/index.html || { echo "FAIL"; exit 1; }
grep -q "Product" marketing/index.html || { echo "FAIL"; exit 1; }
echo "OK"
```
