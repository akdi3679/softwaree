# TASK ID: COMPLIANCE-001.4
# TITLE: Commit compliance suite
# STATUS: pending
# DEPENDENCIES: COMPLIANCE-001.3
# ALLOWED FILES: product/.git/, platform-cloud/.git/, /workspace/docs/
# FORBIDDEN FILES: any other change
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Commit compliance code + docs.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace/platform-cloud
git add src/routes/gdpr.ts src/audit/retention.ts
git commit -m "feat(compliance): add GDPR routes + HIPAA audit retention (COMPLIANCE-001)"

cd /workspace/product
git add apps/admin/src-tauri/src/commands/gdpr.rs
git commit -m "feat(compliance): add right-to-be-forgotten on Admin"

cd /workspace
git add docs/compliance
git commit -m "docs(compliance): add HIPAA and GDPR mapping" || echo "docs separate"
```

## TESTS

```bash
cd /workspace/platform-cloud
git log -1 --pretty=%s | grep -q "COMPLIANCE-001" || { echo "FAIL"; exit 1; }
cd /workspace/product
git log -1 --pretty=%s | grep -q "COMPLIANCE-001" || { echo "FAIL"; exit 1; }
echo "OK"
```
