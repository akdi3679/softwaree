# TASK ID: MODULE-002.4
# TITLE: Add module README and signed build script
# STATUS: pending
# DEPENDENCIES: MODULE-002.3
# ALLOWED FILES: product/modules/medical-reception/README.md, product/modules/food-lab/README.md, product/scripts/publish-module.sh
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Document the modules and add a publish script.

## REQUIRED IMPLEMENTATION

Create `product/modules/medical-reception/README.md`:

```markdown
# medical-reception module

Tracks patients, appointments, and visits for a single-doctor medical reception.

## Commands

- `patient.create` — register a new patient
  - `{ "full_name", "phone", "date_of_birth" }`
- `appointment.create` — schedule an appointment
  - `{ "patient_id", "scheduled_for", "duration_minutes", "reason" }`
- `appointment.cancel` — cancel
  - `{ "appointment_id", "reason" }`
- `appointment.check_in` — mark arrived
  - `{ "appointment_id" }`

## Events emitted

- `patient.created`
- `appointment.created`
- `appointment.cancelled`
- `appointment.checked_in`

## Build

```bash
cargo build --target wasm32-wasip2 --release
```

Output: `target/wasm32-wasip2/release/medical_reception.wasm`
```

Create `product/modules/food-lab/README.md`:

```markdown
# food-lab module

Sample intake → test → analysis → result → report flow for a food analysis lab.

## Commands

- `sample.intake` — register a new sample
  - `{ "client_name", "sample_type", "collected_at", "notes"? }`
- `sample.start_test` — start a test on a sample
  - `{ "sample_id", "test_type", "assigned_tech" }`
- `sample.record_result` — record measurements
  - `{ "sample_id", "test_id", "measurements", "passed" }`
- `sample.issue_report` — finalize and send report
  - `{ "sample_id", "recipient_email" }`

## Events emitted

- `sample.intaken`
- `sample.test_started`
- `sample.result_recorded`
- `sample.report_issued`

## Build

```bash
cargo build --target wasm32-wasip2 --release
```
```

Create `product/scripts/publish-module.sh`:

```bash
#!/usr/bin/env bash
# Publish a module to the Cloud.
# Usage: ./publish-module.sh <module-name> <version> [cloud-url]

set -euo pipefail

MODULE_NAME="${1:?module name required}"
VERSION="${2:?version required}"
CLOUD_URL="${3:-http://localhost:8787}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/modules/$MODULE_NAME"

echo "Building $MODULE_NAME v$VERSION..."
cargo build --target wasm32-wasip2 --release

WASM_FILE="target/wasm32-wasip2/release/${MODULE_NAME//-/_}.wasm"
if [ ! -f "$WASM_FILE" ]; then
  echo "ERROR: build output not found: $WASM_FILE"
  exit 1
fi

SHA256=$(sha256sum "$WASM_FILE" | awk '{print $1}')
SIZE=$(stat -c%s "$WASM_FILE" 2>/dev/null || stat -f%z "$WASM_FILE")
B64=$(base64 -w0 "$WASM_FILE" 2>/dev/null || base64 -i "$WASM_FILE")

echo "Publishing $WASM_FILE ($SIZE bytes, sha256=$SHA256)..."
curl -fsS -X POST "$CLOUD_URL/v1/modules" \
  -H 'content-type: application/json' \
  -d "{
    \"module_id\": \"$MODULE_NAME\",
    \"version\": \"$VERSION\",
    \"binary\": \"$B64\",
    \"min_core_version\": \"0.1.0\",
    \"min_app_version\": \"0.1.0\",
    \"required_permissions\": [\"patients.read\", \"patients.write\"],
    \"provided_commands\": [\"patient.create\", \"appointment.create\"],
    \"provided_events\": [\"patient.created\"],
    \"capabilities\": [\"audit.read\", \"audit.write\"]
  }"

echo ""
echo "Published."
```

## TESTS

```bash
cd product
test -f modules/medical-reception/README.md || { echo "FAIL"; exit 1; }
test -f modules/food-lab/README.md || { echo "FAIL"; exit 1; }
test -f scripts/publish-module.sh || { echo "FAIL: no script"; exit 1; }
chmod +x scripts/publish-module.sh || true
echo "OK"
```
