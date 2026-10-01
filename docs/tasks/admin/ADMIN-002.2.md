# TASK ID: ADMIN-002.2
# TITLE: Configure updater endpoint
# STATUS: pending
# DEPENDENCIES: ADMIN-002.1
# ALLOWED FILES: product/apps/admin/src-tauri/tauri.conf.json
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Configure the Tauri updater plugin to fetch updates from our release endpoint.

## REQUIRED IMPLEMENTATION

Edit `product/apps/admin/src-tauri/tauri.conf.json`. Add a `plugins` key at the top level (sibling of `app`, `bundle`):

```json
"plugins": {
  "updater": {
    "endpoints": [
      "https://releases.product.local/admin/{version}/{platform}-{arch}.{ext}"
    ],
    "pubkey": "REPLACE_WITH_RELEASE_SIGNING_PUBLIC_KEY",
    "windows": {
      "installMode": "passive"
    }
  }
}
```

Note: the `pubkey` is the ed25519 public key used to sign releases. Generated with `tauri signer generate -w ~/.tauri/product.key`. In production this is replaced with the real key.

## TESTS

```bash
cd product
node -e "
const c = JSON.parse(require('fs').readFileSync('apps/admin/src-tauri/tauri.conf.json','utf8'));
if (!c.plugins?.updater?.endpoints?.[0]) process.exit(1);
if (!c.plugins.updater.pubkey) process.exit(1);
"
```
