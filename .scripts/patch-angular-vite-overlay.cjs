'use strict';

const { readFileSync, writeFileSync, existsSync } = require('fs');
const { join } = require('path');

const root = join(__dirname, '..');
const pluginPath = join(root, 'node_modules', '@angular', 'build', 'src', 'tools', 'vite', 'plugins', 'angular-memory-plugin.js');

if (!existsSync(pluginPath)) return;

let content = readFileSync(pluginPath, 'utf-8');

if (content.includes('overlayTextRegex')) return;

const old = `async function loadViteClientCode(file, disableViteTransport = false) {
    const originalContents = await (0, promises_1.readFile)(file, 'utf-8');
    let updatedContents = originalContents.replace('"You can also disable this overlay by setting ", ' +
        'h("code", { part: "config-option-name" }, "server.hmr.overlay"), ' +
        '" to ", ' +
        'h("code", { part: "config-option-value" }, "false"), ' +
        '" in ", ' +
        'h("code", { part: "config-file-name" }, hmrConfigName), ' +
        '"."', '');
    (0, node_assert_1.default)(originalContents !== updatedContents, 'Failed to update Vite client error overlay text.');
    if (disableViteTransport) {`;

const replacement = `async function loadViteClientCode(file, disableViteTransport = false) {
    const originalContents = await (0, promises_1.readFile)(file, 'utf-8');
    const overlayTextRegex = /\\s*"You can also disable this overlay by setting "\\s*,\\s*h\\("code",\\s*\\{\\s*part:\\s*"config-option-name"\\s*\\},\\s*"server\\.hmr\\.overlay"\\)\\s*,\\s*" to "\\s*,\\s*h\\("code",\\s*\\{\\s*part:\\s*"config-option-value"\\s*\\},\\s*"false"\\)\\s*,\\s*" in "\\s*,\\s*h\\("code",\\s*\\{\\s*part:\\s*"config-file-name"\\s*\\},\\s*hmrConfigName\\)\\s*,\\s*"\\."/;
    let updatedContents = originalContents.replace(overlayTextRegex, '');
    if (originalContents === updatedContents) {
        updatedContents = originalContents.replace('"You can also disable this overlay by setting ", ' +
            'h("code", { part: "config-option-name" }, "server.hmr.overlay"), ' +
            '" to ", ' +
            'h("code", { part: "config-option-value" }, "false"), ' +
            '" in ", ' +
            'h("code", { part: "config-file-name" }, hmrConfigName), ' +
            '"."', '');
    }
    if (originalContents === updatedContents) {
        return originalContents;
    }
    if (disableViteTransport) {`;

if (!content.includes(old)) return;

content = content.replace(old, replacement);
writeFileSync(pluginPath, content);
console.log('Applied @angular/build Vite overlay patch (Windows/multi-line fix).');
