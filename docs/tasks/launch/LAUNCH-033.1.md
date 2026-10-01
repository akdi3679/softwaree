# TASK ID: LAUNCH-033.1
# TITLE: Add: v1.0 release tag
# STATUS: pending
# DEPENDENCIES: LAUNCH-032.2
# ALLOWED FILES: product/CHANGELOG.md
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Tag v1.0.0 in product. The official launch.

## REQUIRED IMPLEMENTATION

Edit `product/CHANGELOG.md` — change `[Unreleased]` to `[1.0.0] - 2026-08-15`.

```bash
cd /workspace/product
# Once the commit is in
git tag -a v1.0.0 -m "Product v1.0.0 GA — 980+ tasks, 5 sample modules, full enterprise platform"
git push origin v1.0.0
```

## TESTS

```bash
cd /workspace/product
grep -q "1.0.0" CHANGELOG.md || { echo "FAIL"; exit 1; }
echo "OK"
```
