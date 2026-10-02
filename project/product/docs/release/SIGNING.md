# Tauri signing keys

Tauri uses an Ed25519 key pair to sign updater bundles. Without this key, the updater refuses new bundles.

## Generation (one-time)

    cd product/apps/admin/src-tauri
    pnpm tauri signer generate --password "<strong-password>"

Produces:
- keygen.key (private) - NEVER commit, store in Infisical
- keygen.key.pub (public) - commit; lives in tauri.conf.json

## Storage

Private key + password stored in two places:

1. Infisical under release/tauri-signing-private-key and release/tauri-signing-private-key-password
2. Offline USB backup, stored in a safe

GitHub Actions reads them from the secrets store.

## Rotation

If compromised:
1. Generate a new key pair
2. Update public key in both tauri.conf.json files
3. Sign all past releases with the new key
4. Cut a new release

## Loss

If we lose the private key, we cannot sign new updates. Existing clients see "signature invalid" forever. Recovery: ship a new client (deb/dmg) containing a fresh key.

## macOS code signing (separate key)

Apple Developer ID Application certificate. Store p12 in Infisical as release/apple-developer-id-p12 (base64) + password.

## Windows code signing

signtool.exe with a code-signing certificate. Store pfx in Infisical as release/windows-codesign-pfx + password.
