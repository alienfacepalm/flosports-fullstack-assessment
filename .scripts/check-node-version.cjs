'use strict';

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const nvmrcPath = path.join(root, '.nvmrc');
const requested = fs.existsSync(nvmrcPath)
  ? fs.readFileSync(nvmrcPath, 'utf-8').trim()
  : null;

if (!requested) process.exit(0);

const current = process.version.slice(1); // strip 'v'

function parseMajor(v) {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
}

let ok = false;
if (/^\d+$/.test(requested)) {
  const wantMajor = parseInt(requested, 10);
  const curMajor = parseMajor(current.split('.')[0]);
  ok = curMajor === wantMajor;
} else if (requested === 'lts/*' || requested.startsWith('lts/')) {
  const curMajor = parseMajor(current.split('.')[0]);
  ok = curMajor >= 18;
} else if (/^\d+\.\d+/.test(requested)) {
  const [wantMajor, wantMinor] = requested.split('.').map(Number);
  const [curMajor, curMinor] = current.split('.').map((s) => parseInt(s, 10) || 0);
  ok = curMajor > wantMajor || (curMajor === wantMajor && curMinor >= (wantMinor || 0));
}

if (!ok) {
  console.error(
    `[node version] .nvmrc requires Node ${requested}, but current is ${process.version}. Run \`nvm use\` or \`fnm use\` then try again.`
  );
  process.exit(1);
}
