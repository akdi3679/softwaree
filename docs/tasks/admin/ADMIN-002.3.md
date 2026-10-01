# TASK ID: ADMIN-002.3
# TITLE: Add Tauri icon set
# STATUS: pending
# DEPENDENCIES: ADMIN-002.2
# ALLOWED FILES: product/apps/admin/src-tauri/icons/ (placeholder icons), product/apps/admin/src-tauri/tauri.conf.json
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 5 minutes

## OBJECTIVE
Generate placeholder icon files for the Admin app. Tauri requires icons in specific sizes and formats.

## REQUIRED IMPLEMENTATION

```bash
cd product/apps/admin/src-tauri
mkdir -p icons
# For dev, use a single 1024x1024 source PNG and generate all sizes
# In production, replace with proper designed icons
pnpm dlx @tauri-apps/cli@latest icon ./icons/icon.png --output ./icons/ 2>/dev/null || true
# If tauri CLI not available, create minimal valid 1x1 placeholder PNGs
if [ ! -f icons/32x32.png ]; then
  # Create a minimal 1x1 transparent PNG using printf (real icon is replaced later)
  printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\x0d\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82' > icons/32x32.png
  cp icons/32x32.png icons/128x128.png
  cp icons/32x32.png icons/128x128@2x.png
fi
```

Note: placeholder icons only — replace with real icons before production.

## TESTS

```bash
cd product
test -f apps/admin/src-tauri/icons/32x32.png || { echo "FAIL"; exit 1; }
test -f apps/admin/src-tauri/icons/128x128.png || { echo "FAIL"; exit 1; }
test -f apps/admin/src-tauri/icons/128x128@2x.png || { echo "FAIL"; exit 1; }
echo "OK"
```
