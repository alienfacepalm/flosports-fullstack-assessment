import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const pkgPath = join(root, 'dist', 'apps', 'api', 'package.json');

try {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  if (pkg.pnpm) {
    delete pkg.pnpm;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
}
