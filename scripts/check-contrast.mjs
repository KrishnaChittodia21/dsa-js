#!/usr/bin/env node
// WCAG AA check for the design tokens: every text-ish token on every background-ish token,
// for both themes and every accent. Usage: node scripts/check-contrast.mjs
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const block = (sel) => {
  const re = new RegExp(sel.replace(/[[\]'=]/g, (c) => '\\' + c) + '\\s*\\{([^}]*)\\}', 'g');
  const out = {};
  for (const m of css.matchAll(re)) for (const d of m[1].matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)) out[d[1]] = d[2];
  return out;
};
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const light = { ...block(":root,\n:root[data-theme='light']"), ...block(":root[data-theme='light']") };
const dark = { ...light, ...block(":root[data-theme='dark']") };
const accents = ['teal', 'rose', 'amber'];
const PAIRS = [
  ['text', ['bg', 'surface', 'surface-2', 'surface-hover']],
  ['text-2', ['bg', 'surface', 'surface-2']],
  ['muted', ['bg', 'surface', 'surface-2']],
  ['accent', ['bg', 'surface', 'surface-2', 'accent-soft']],
  ['accent-text', ['accent']],
  ['good', ['bg', 'surface', 'good-soft']],
  ['warn', ['bg', 'surface', 'warn-soft']],
  ['bad', ['bg', 'surface', 'bad-soft']],
  ['info', ['bg', 'surface', 'info-soft']],
  ['on-status', ['good', 'warn', 'bad']],
  ['on-highlight', ['highlight']],
  ['text', ['highlight-soft', 'viz-active', 'viz-window', 'viz-done', 'viz-bad', 'code-selection']],
  ['code-text', ['code-bg']], ['code-keyword', ['code-bg']], ['code-string', ['code-bg']], ['code-number', ['code-bg']],
  ['code-comment', ['code-bg']], ['code-function', ['code-bg']], ['code-punct', ['code-bg']], ['code-gutter', ['code-bg']],
];
let fails = 0;
const run = (name, t) => {
  for (const [fg, bgs] of PAIRS)
    for (const bg of bgs) {
      if (!t[fg] || !t[bg]) continue;
      if (fg === 'text' && bg.startsWith('viz-') && name.includes('dark') && bg !== 'viz-window') {
        // dark viz fills carry light text
      }
      const r = ratio(t[fg], t[bg]);
      const need = fg === 'code-gutter' ? 3 : 4.5;
      if (r < need) {
        fails++;
        console.log(`✖ ${name}: --${fg} on --${bg} = ${r.toFixed(2)} (need ${need})`);
      }
    }
};
run('light', light);
run('dark', dark);
for (const a of accents) {
  run(`light/${a}`, { ...light, ...block(`:root[data-accent='${a}']`) });
  run(`dark/${a}`, { ...dark, ...block(`:root[data-accent='${a}'][data-theme='dark']`) });
}
console.log(fails ? `\n${fails} pairs below AA` : '✔ all token pairs meet WCAG AA');
process.exit(fails ? 1 : 0);
