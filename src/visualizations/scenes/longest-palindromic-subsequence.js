// Longest Palindromic Subsequence: cell (i, j) = the longest palindrome you can keep from s[i..j] by crossing letters
// out. Equal end letters wrap the best of the inside (+2); different ones cross out one end and keep the better
// rest. Works with a full table dp[i][j] or rolling rows (the row being filled + the row below it, any names).
import { options, row, writtenCell } from './util.js';

const OTHER = ['next', 'nxt', 'prev', 'prevRow', 'below', 'down', 'last', 'old', 'dp', 'memo', 'nextRow', 'lower'];
const IDX = ['i', 'a', 'l', 'left', 'lo', 'start', 'r', 'x'];
const q = (x) => `'${x}'`;
const num = (v) => typeof v === 'number' && Number.isFinite(v);

/** the cell this line writes: { i, j, v, inner, down (drop s[i]), left (drop s[j]) } */
function readCell(vars, src, params, s) {
  if (typeof s !== 'string') return null;
  const w = writtenCell(src, vars);
  if (!w || params.includes(w.name)) return null;
  const g = vars[w.name];
  let i;
  let j;
  let at;
  let below;
  if (w.at.length === 2 && Array.isArray(g) && g.length === s.length && g.every((r) => row(r))) {
    [i, j] = w.at;
    at = (r, c) => g[r]?.[c];
    below = (c) => g[i + 1]?.[c];
  } else if (w.at.length === 1 && row(g) && g.length === s.length) {
    j = w.at[0];
    i = IDX.map((k) => vars[k]).find((x) => Number.isInteger(x) && x <= j);
    const o = OTHER.filter((k) => k !== w.name && !params.includes(k)).map((k) => row(vars[k])).find((r) => r && r.length === g.length);
    at = (r, c) => (r === i ? g[c] : undefined);
    below = (c) => o?.[c];
  } else return null;
  if (!Number.isInteger(i) || !(i >= 0 && j >= i && j < s.length)) return null;
  const v = at(i, j);
  if (!num(v)) return null;
  const inner = j - i < 2 ? 0 : below(j - 1);
  return { i, j, v, inner, down: below(j), left: at(i, j - 1), sub: s.slice(i, j + 1), mid: s.slice(i + 1, j) };
}

/** what kind of cell: 'one', 'wrap' (ends match), 'drop' (ends differ), or null when it does not fit the rule */
function kindOf(c, s) {
  if (c.i === c.j) return c.v === 1 ? 'one' : null;
  if (s[c.i] === s[c.j]) return num(c.inner) && c.v === c.inner + 2 ? 'wrap' : null;
  return num(c.down) && num(c.left) && c.v === Math.max(c.down, c.left) ? 'drop' : null;
}

export default {
  id: 'longest-palindromic-subsequence',
  metaphor: 'Crossing out letters to leave a palindrome',
  caption: 'A cell holds the longest palindrome left in s[i..j] after crossing letters out. Matching ends wrap the inside and add 2; different ends cross one out and keep the better rest.',
  pointers: ['i', 'j'],
  narrate(ctx) {
    const sn = ctx.params[0];
    const s = ctx.vars[sn] ?? ctx.input?.[0];
    if (typeof s !== 'string') return null;
    if (ctx.ret && !ctx.next && num(ctx.value)) return `the longest palindrome left in ${q(s)} after crossing letters out has ${ctx.value} letter${ctx.value === 1 ? '' : 's'}`;
    const c = readCell(ctx.vars, ctx.src, ctx.params, s);
    if (!c) return null;
    const at = `${sn}[${c.i}..${c.j}] = ${q(c.sub)}`;
    const k = kindOf(c, s);
    if (k === 'one') return `${at}: one letter is a palindrome of length 1`;
    if (k === 'wrap') return c.j === c.i + 1 ? `${at}: two equal letters, keep both: 2` : `${at}: both ends ${q(s[c.i])}, wrap the inside ${q(c.mid)} (${c.inner}): ${c.inner} + 2 = ${c.v}`;
    if (k === 'drop') return `${at}: ends ${q(s[c.i])} ≠ ${q(s[c.j])}, cross one out: without the first ${c.down}, without the last ${c.left} → ${c.v}`;
    return `${at}: the longest palindrome left is ${c.v}`;
  },
  // before a cell that needs thought: matching ends around a non-empty inside, or two different ends whose rests differ
  predict(ctx) {
    if (!ctx.next) return null;
    const s = ctx.vars[ctx.params[0]] ?? ctx.input?.[0];
    const c = readCell(ctx.next.vars, ctx.lines?.[ctx.next.line - 1], ctx.params, s);
    if (!c) return null;
    const k = kindOf(c, s);
    const ask = `How long is the longest palindrome left in ${q(c.sub)}?`;
    if (k === 'wrap' && c.inner > 0) return options(ask, c.v, [c.inner + 1, c.inner, c.v + 1].filter((w) => w !== c.v), `Both ends are ${q(s[c.i])}: keep them around the best of the inside ${q(c.mid)} (${c.inner}), so ${c.inner} + 2.`);
    if (k === 'drop' && c.down !== c.left) return options(ask, c.v, [Math.min(c.down, c.left), c.v + 2, c.v + 1].filter((w) => w !== c.v), `${q(s[c.i])} and ${q(s[c.j])} cannot both stay, so cross one out and keep the better rest: ${c.down} or ${c.left}.`);
    return null;
  },
  bugs: [
    {
      label: 'Different ends: take the inside only',
      find: 'Math.max(next[j], cur[j - 1])',
      replace: 'next[j - 1]',
      explain: 'Crossing out both ends throws away a palindrome that uses one of them: "ab" gives 0 instead of 1.',
    },
    {
      label: 'Count a lone letter as a pair',
      find: 'cur[i] = 1;',
      replace: 'cur[i] = 2;',
      explain: 'A single letter is a palindrome of length 1, not 2: every answer that wraps a middle letter comes out one too long.',
    },
  ],
};
