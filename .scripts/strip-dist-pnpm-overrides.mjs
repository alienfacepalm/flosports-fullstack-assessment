import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const pkgPath = resolve(process.cwd(), 'dist/apps/api/package.json');

try {
  const raw = await readFile(pkgPath, 'utf8');
  const json = JSON.parse(raw);

  if (json && typeof json === 'object' && 'pnpm' in json) {
    delete json.pnpm;
    await writeFile(pkgPath, `${JSON.stringify(json, null, 2)}\n`, 'utf8');
  }
} catch (err) {
  // Keep pruning resilient; this is a best-effort cleanup.
  if (process.env.DEBUG_STRIP_DIST_PNPM === '1') {
    // eslint-disable-next-line no-console
    console.warn('strip-dist-pnpm-overrides failed:', err);
  }
}

