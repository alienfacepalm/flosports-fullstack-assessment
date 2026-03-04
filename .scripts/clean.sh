#!/usr/bin/env bash
set -euo pipefail

echo "🧹 Stopping Nx daemon..."
pnpm nx daemon --stop || true

echo "🧼 Checking Nx daemon status..."
pnpm nx daemon --status || true

echo "🧼 Removing cached artifacts and dependencies..."
rm -rf node_modules
rm -rf dist
rm -rf .angular
rm -rf .nx

echo "🔄 Reinstalling dependencies with pnpm..."
pnpm install

echo "🚀 Restarting Nx daemon..."
pnpm nx daemon --start

echo "✅ Clean completed. You can now run your apps (e.g. 'pnpm start:ui')."
