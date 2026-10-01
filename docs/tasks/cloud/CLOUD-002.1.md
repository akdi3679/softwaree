# TASK ID: CLOUD-002.1
# TITLE: Create apps/api/ directory
# STATUS: pending
# DEPENDENCIES: CLOUD-001.6
# ALLOWED FILES: platform-cloud/apps/api/ (directory)
# FORBIDDEN FILES: any file
# OWNER: any
# ESTIMATED EFFORT: 1 minute

## OBJECTIVE
Create the API app directory.

## REQUIRED IMPLEMENTATION

```bash
cd platform-cloud
mkdir -p apps/api/src
```

## TESTS

```bash
cd platform-cloud
test -d apps/api/src || { echo "FAIL"; exit 1; }
echo "OK"
```
