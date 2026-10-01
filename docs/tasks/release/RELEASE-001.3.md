# TASK ID: RELEASE-001.3
# TITLE: Add Tauri signing key generation docs
# STATUS: pending
# DEPENDENCIES: RELEASE-001.2
# ALLOWED FILES: /workspace/docs/release/SIGNING.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Document the Tauri signing key generation and storage procedure.

## REQUIRED IMPLEMENTATION

Create `/workspace/docs/release/SIGNING.md`:

```markdown
# Tauri signing keys

Tauri uses an Ed25519 key pair to sign updater bundles. Without this key, the updater refuses to install new bundles.

## Generation (one-time)

```bash
cd product/apps/admin/src-tauri
pnpm tauri signer generate --password "<choose-a-strong-password>"
```

This produces:
- `keygen.key` (private) — NEVER commit, store in Infisical
- `keygen.key.pub` (public) — commit, lives in tauri.conf.json

## Storage

The private key + password are stored in two places:

1. **Infisical**, under:
   - `release/tauri-signing-private-key` (the keygen.key content)
   - `release/tauri-signing-private-key-password` (the password)

2. **Offline backup**: the secrets admin downloads a copy to a USB drive stored in a safe.

GitHub Actions reads them from the secrets store.

## Rotation

If a key is compromised:
1. Generate a new key pair
2. Update the public key in both `apps/admin/src-tauri/tauri.conf.json` and `apps/user/src-tauri/tauri.conf.json`
3. Sign ALL past releases with the new key (using `pnpm tauri signer sign`)
4. Cut a new release
5. Old clients receive the new public key on first update

## Loss

If we lose the private key, we cannot sign new updates. Existing clients will see "signature invalid" forever. Recovery: ship a new client (e.g., deb) that contains a fresh key. This is why we keep an offline backup.

## Mac code signing (separate key)

```bash
# Apple Developer ID Application certificate
security create-keychain -p <password> build.keychain
security import <path-to-p12>.p12 -k build.keychain -P <p12-password>
```

Stored in Infisical: `release/apple-developer-id-p12` (base64-encoded p12 file) and the password.

## Windows code signing

Use `signtool.exe` with a code-signing certificate. Stored as pfx in Infisical:
- `release/windows-codesign-pfx`
- `release/windows-codesign-password`
```

## TESTS

```bash
cd /workspace
test -f docs/release/SIGNING.md || { echo "FAIL"; exit 1; }
grep -q "tauri signer generate" docs/release/SIGNING.md || { echo "FAIL: no sign gen"; exit 1; }
echo "OK"
```
