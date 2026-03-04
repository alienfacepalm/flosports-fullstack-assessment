#!/usr/bin/env bash
set -euo pipefail

echo "🧪 Running all tests..."
pnpm exec nx run-many -t test --all

echo "✅ Tests passed."
MSG="${*:-}"
if [ -z "$MSG" ]; then
  echo 'Usage: pnpm run '\''$$cp'\'' -- "your commit message"'
  echo "Commit message is required."
  exit 1
fi

git add .
git commit -m "$MSG"
git push
echo "✅ Committed and pushed."
