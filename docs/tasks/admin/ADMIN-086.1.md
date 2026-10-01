# TASK ID: ADMIN-086.1
# TITLE: Add Admin: open-graph meta tags
# STATUS: pending
# DEPENDENCIES: ADMIN-085.2
# ALLOWED FILES: product/apps/admin/index.html
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
When the app is shared, show nice preview.

## REQUIRED IMPLEMENTATION

Edit `product/apps/admin/index.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/icon.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Product Admin</title>
  <meta name="description" content="Local-first admin app for the Product platform." />
  <meta property="og:title" content="Product Admin" />
  <meta property="og:description" content="Local-first admin app for the Product platform." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://example.com/admin" />
  <meta name="twitter:card" content="summary" />
  <meta name="theme-color" content="#2563eb" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

## TESTS

```bash
cd product
grep -q "og:title" apps/admin/index.html || { echo "FAIL"; exit 1; }
grep -q "theme-color" apps/admin/index.html || { echo "FAIL"; exit 1; }
echo "OK"
```
