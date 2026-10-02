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

SHA256=$(sha256sum "$WASM_FILE" | awk "{print \$1}")
SIZE=$(stat -c%s "$WASM_FILE" 2>/dev/null || stat -f%z "$WASM_FILE")
B64=$(base64 -w0 "$WASM_FILE" 2>/dev/null || base64 -i "$WASM_FILE")

echo "Publishing $WASM_FILE ($SIZE bytes, sha256=$SHA256)..."
curl -fsS -X POST "$CLOUD_URL/v1/modules" \
  -H "content-type: application/json" \
  -d "{ \"module_id\": \"$MODULE_NAME\", \"version\": \"$VERSION\", \"binary\": \"$B64\" }"

echo ""
echo "Published."
