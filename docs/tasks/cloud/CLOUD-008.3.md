# TASK ID: CLOUD-008.3
# TITLE: Commit Cloud Helm + e2e tests
# STATUS: pending
# DEPENDENCIES: CLOUD-008.2
# ALLOWED FILES: platform-cloud/.git/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit Helm chart and e2e tests.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/platform-cloud
git add helm e2e playwright.config.ts package.json
git commit -m "feat(cloud): add Helm chart and Playwright e2e tests (CLOUD-008)"
```

## TESTS

```bash
cd /workspace/platform-cloud
git log -1 --pretty=%s | grep -q "CLOUD-008" || { echo "FAIL"; exit 1; }
echo "OK"
```
