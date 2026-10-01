# TASK ID: RELEASE-002.1
# TITLE: Add release: automatic version bumping in CI
# STATUS: pending
# DEPENDENCIES: CHAOS-007.2
# ALLOWED FILES: .github/workflows/release.yml
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Push tag → CI builds + signs + uploads + announces.

## REQUIRED IMPLEMENTATION

Create `.github/workflows/release.yml`:

```yaml
name: Release
on:
  push:
    tags:
      - 'v*'
permissions:
  contents: write
jobs:
  release:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        target:
          - x86_64-unknown-linux-gnu
          - x86_64-apple-darwin
          - aarch64-apple-darwin
          - x86_64-pc-windows-msvc
    steps:
      - uses: actions/checkout@v4
      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
      - name: Build Tauri app
        run: |
          cd product/apps/admin
          cargo build --release --target ${{ matrix.target }}
      - name: Sign binaries
        env:
          COSIGN_KEY: ${{ secrets.COSIGN_KEY }}
        run: |
          cosign sign-blob --yes \
            product/apps/admin/target/${{ matrix.target }}/release/product-admin \
            --output-signature release.sig
      - name: Upload release assets
        uses: softprops/action-gh-release@v2
        with:
          files: |
            product/apps/admin/target/${{ matrix.target }}/release/product-admin*
            release.sig
          body: |
            See CHANGELOG.md for changes.
      - name: Post Slack notification
        if: success()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {"text": "Released ${{ github.ref_name }} (${{ matrix.target }})"}
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

## TESTS

```bash
cd /workspace
test -f .github/workflows/release.yml || { echo "FAIL"; exit 1; }
grep -q "cosign" .github/workflows/release.yml || { echo "FAIL"; exit 1; }
echo "OK"
```
