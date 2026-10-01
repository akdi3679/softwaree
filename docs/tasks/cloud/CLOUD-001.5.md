# TASK ID: CLOUD-001.5
# TITLE: Configure Biome for cloud
# STATUS: pending
# DEPENDENCIES: CLOUD-001.4
# ALLOWED FILES: platform-cloud/biome.json
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Configure Biome for the cloud repo.

## REQUIRED IMPLEMENTATION

Create `platform-cloud/biome.json`:

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.3/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": {
    "ignoreUnknown": true,
    "ignore": ["**/node_modules/**", "**/dist/**", "**/coverage/**", "drizzle/**"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": { "noExplicitAny": "error", "noConsole": "warn" },
      "style": { "useImportType": "error", "useExportType": "error" }
    }
  }
}
```

## TESTS

```bash
cd platform-cloud
test -f biome.json || { echo "FAIL"; exit 1; }
pnpm exec biome --version | grep -q "^1.9" || { echo "FAIL"; exit 1; }
echo "OK"
```
