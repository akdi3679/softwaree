# TASK ID: SECURITY-002.1
# TITLE: Add secret scanning to CI
# STATUS: pending
# DEPENDENCIES: CONTRACT-084.3
# ALLOWED FILES: product/.github/workflows/secret-scan.yml
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Add Gitleaks to CI to prevent secrets from being committed.

## REQUIRED IMPLEMENTATION

Create `product/.github/workflows/secret-scan.yml`:

```yaml
name: secret-scan

on:
  push:
    branches: [main]
  pull_request:

jobs:
  gitleaks:
    runs-on: ubuntu-22.04
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITLEAKS_LICENSE: ${{ secrets.GITLEAKS_LICENSE }}  # optional, for pro
```

Add `.gitleaks.toml` at the repo root:

```toml
# Gitleaks config
title = "Product"

[extend]
useDefault = true

[[rules]]
id = "stripe-key"
description = "Stripe API key"
regex = '''sk_(?:live|test)_[A-Za-z0-9]{24,99}'''
tags = ["secret", "stripe"]

[[rules]]
id = "aws-access-key"
description = "AWS Access Key"
regex = '''AKIA[0-9A-Z]{16}'''
tags = ["secret", "aws"]

[[rules]]
id = "private-key"
description = "Private key"
regex = '''-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----'''
tags = ["secret"]

[[rules]]
id = "tailscale-key"
description = "our mesh pre-auth key"
regex = '''tskey-[a-zA-Z0-9_]{40,}'''
tags = ["secret", "tailscale"]

[[rules]]
id = "tauri-signing-key"
description = "Tauri signing private key"
regex = '''"dGtleSI6Wz.*?"'''
tags = ["secret", "tauri"]

[allowlist]
paths = [
  '''\.md$''',
  '''docs/.*''',
  '''test_.*\.rs$''',
  '''test_.*\.ts$''',
]
```

## TESTS

```bash
cd product
test -f .github/workflows/secret-scan.yml || { echo "FAIL"; exit 1; }
test -f .gitleaks.toml || { echo "FAIL: no config"; exit 1; }
grep -q "gitleaks" .github/workflows/secret-scan.yml || { echo "FAIL"; exit 1; }
echo "OK"
```
