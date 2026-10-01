# TASK ID: ADMIN-088.1
# TITLE: Add Admin: rebrand: change Product → our real name
# STATUS: pending
# DEPENDENCIES: ADMIN-087.2
# ALLOWED FILES: product/apps/admin/index.html, product/apps/admin/src-tauri/tauri.conf.json
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
One place to change the product name.

## REQUIRED IMPLEMENTATION

Edit `product/apps/admin/index.html`: replace `Product Admin` with `{{COMPANY_NAME}} Admin`.

Edit `product/apps/admin/src-tauri/tauri.conf.json`:

```json
{
  "productName": "{{COMPANY_NAME}} Admin",
  "identifier": "com.{{company_slug}}.admin",
  "bundle": {
    "publisher": "{{COMPANY_NAME}}",
    "shortDescription": "{{COMPANY_NAME}} admin app"
  }
}
```

Add a script `tools/rebrand.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail
NAME="${1:?usage: rebrand.sh 'Our Name'}"
SLUG=$(echo "$NAME" | tr '[:upper:] ' '[:lower:]-')
# Replace {{COMPANY_NAME}} and {{company_slug}} everywhere
find product platform-cloud docs tools -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.rs" -o -name "*.json" -o -name "*.html" -o -name "*.md" -o -name "*.yml" \) -exec sed -i "s/{{COMPANY_NAME}}/$NAME/g; s/{{company_slug}}/$SLUG/g" {} +
echo "Rebranded to $NAME (slug: $SLUG)"
chmod +x tools/rebrand.sh
```

## TESTS

```bash
cd product
grep -q "COMPANY_NAME" apps/admin/index.html || { echo "FAIL"; exit 1; }
grep -q "productName" apps/admin/src-tauri/tauri.conf.json || { echo "FAIL"; exit 1; }
echo "OK"
```
