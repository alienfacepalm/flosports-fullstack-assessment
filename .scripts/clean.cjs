'use strict';

const { rmSync, existsSync } = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const root = process.cwd();
const dirs = ['node_modules', 'dist', '.angular', '.nx'];

console.log('Stopping Nx daemon...');
try {
  execSync('pnpm nx daemon --stop', { cwd: root, stdio: 'inherit' });
} catch {
  // ignore
}

console.log('Removing cached artifacts and dependencies...');
for (const d of dirs) {
  const full = path.join(root, d);
  if (existsSync(full)) {
    rmSync(full, { recursive: true });
    console.log('  removed', d);
  }
}

console.log('Reinstalling dependencies with pnpm...');
execSync('pnpm install', { cwd: root, stdio: 'inherit' });

console.log('Starting Nx daemon...');
try {
  execSync('pnpm nx daemon --start', { cwd: root, stdio: 'inherit' });
} catch {
  // ignore
}

console.log('Clean completed. You can now run your apps (e.g. pnpm start).');
