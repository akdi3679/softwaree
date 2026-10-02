#!/usr/bin/env bash
set -euo pipefail
NAME="${1:?usage: rebrand.sh 'Our Name'}"
SLUG=$(echo "$NAME" | tr '[:upper:] ' '[:lower:]-')
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.rs" -o -name "*.json" -o -name "*.html" -o -name "*.md" -o -name "*.yml" \) -exec sed -i "s/{{COMPANY_NAME}}/$NAME/g; s/{{company_slug}}/$SLUG/g" {} +
echo "Rebranded to $NAME (slug: $SLUG)"
chmod +x tools/rebrand.sh
