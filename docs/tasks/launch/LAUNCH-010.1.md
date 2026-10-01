# TASK ID: LAUNCH-010.1
# TITLE: Add public status page UI
# STATUS: pending
# DEPENDENCIES: LAUNCH-009.2
# ALLOWED FILES: status/index.html, status/styles.css
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Customer-facing status page. Hosted on Cloudflare Pages. No auth.

## REQUIRED IMPLEMENTATION

Create `status/index.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Product Status</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header><h1>Product Status</h1><p class="muted" id="updated"></p></header>
  <main>
    <section id="overall">
      <h2>Overall</h2>
      <div class="big" id="uptime">—</div>
      <p class="muted">Last 30 days</p>
    </section>
    <section id="components">
      <h2>Components</h2>
      <table>
        <thead><tr><th>Component</th><th>Status</th><th>30-day uptime</th></tr></thead>
        <tbody id="rows"></tbody>
      </table>
    </section>
    <section id="incidents">
      <h2>Recent incidents</h2>
      <ul id="incidents"></ul>
    </section>
  </main>
  <script>
    async function load() {
      const r = await fetch('https://api.example.com/v1/status/public');
      const d = await r.json();
      document.getElementById('updated').textContent = 'Updated ' + new Date().toLocaleString();
      document.getElementById('uptime').textContent = d.uptime_pct_30d.toFixed(2) + '%';
      const rows = document.getElementById('rows');
      for (const c of d.components ?? []) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${c.name}</td><td><span class="badge badge-${c.status}">${c.status}</span></td><td>${c.uptime.toFixed(2)}%</td>`;
        rows.appendChild(tr);
      }
      const ul = document.getElementById('incidents');
      for (const i of d.recent_incidents ?? []) {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${i.title}</strong> — <span class="muted">${new Date(i.started_at).toLocaleString()}</span> <span>${i.public_summary ?? ''}</span>`;
        ul.appendChild(li);
      }
    }
    load();
    setInterval(load, 60000);
  </script>
</body>
</html>
```

Create `status/styles.css`:

```css
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; color: #111827; }
header h1 { margin: 0; }
.muted { color: #6b7280; font-size: 0.875rem; }
.big { font-size: 4rem; font-weight: 700; color: #16a34a; }
section { margin-top: 2rem; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 0.5rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
.badge { padding: 0.125rem 0.5rem; border-radius: 4px; font-size: 0.75rem; }
.badge-ok { background: #dcfce7; color: #166534; }
.badge-degraded { background: #fef3c7; color: #854d0e; }
.badge-down { background: #fee2e2; color: #991b1b; }
ul { list-style: none; padding: 0; }
li { padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb; }
```

## TESTS

```bash
cd /workspace
test -f status/index.html || { echo "FAIL"; exit 1; }
test -f status/styles.css || { echo "FAIL: no css"; exit 1; }
grep -q "Status" status/index.html || { echo "FAIL"; exit 1; }
echo "OK"
```
