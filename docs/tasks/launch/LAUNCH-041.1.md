# TASK ID: LAUNCH-041.1
# TITLE: Add: final tarball
# STATUS: pending
# DEPENDENCIES: LAUNCH-040.2
# ALLOWED FILES: /workspace/product-platform-spec.tar.gz
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Refresh the final tarball.

## REQUIRED IMPLEMENTATION

```bash
cd /workspace
tar czf product-platform-spec.tar.gz tasks docs
ls -lh product-platform-spec.tar.gz
echo "Final stats:"
find tasks -name "*.md" -not -name "README*" | wc -l
find tasks -name "*.md" -exec wc -l {} + | tail -1
ls tasks | wc -l
```

## TESTS

```bash
test -f /workspace/product-platform-spec.tar.gz || { echo "FAIL"; exit 1; }
ls -lh /workspace/product-platform-spec.tar.gz | grep -q "1000" || echo "Note: tarball size below 1000K"
echo "OK"
```
