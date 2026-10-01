# TASK ID: CLOUD-001.1
# TITLE: Create platform-cloud/ repo root
# STATUS: pending
# DEPENDENCIES: CONTRACT-017.3
# ALLOWED FILES: platform-cloud/ (directory)
# FORBIDDEN FILES: any file
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Create the root directory for the `platform-cloud` repository (sibling of `product/`).

## REQUIRED IMPLEMENTATION

```bash
cd /workspace
mkdir -p platform-cloud
cd platform-cloud
git init --initial-branch=main
git config --local user.email "dev@cloud.local"
git config --local user.name "Cloud Dev"
```

## ACCEPTANCE CRITERIA
- [ ] `platform-cloud/` exists at the workspace root
- [ ] `.git/` initialized with `main` as default
- [ ] Local git identity set

## TESTS

```bash
test -d platform-cloud && test -d platform-cloud/.git || { echo "FAIL"; exit 1; }
cd platform-cloud && git symbolic-ref HEAD refs/heads/main || { echo "FAIL"; exit 1; }
echo "OK"
```
