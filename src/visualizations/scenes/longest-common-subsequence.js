// Longest Common Subsequence: cell (i, j) = the longest run of letters both prefixes share, in order. Equal last
// letters extend the diagonal by one; different ones keep the better of dropping a letter from either word.
// Works with a full 2-D table or rolling rows (prev / cur), prefixes or suffixes, either word on the rows.
import { changedIdx, firstInt, options, row } from './util.js';

const ROWNAMES = ['prev', 'prevRow', 'previous', 'last', 'above', 'up', 'dp', 'memo', 'table', 'cur', 'curr', 'row', 'next', 'newRow'];
const IDX = ['i', 'r', 'a'];
const isGrid = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r));
// set-up lines and row hand-overs (prev = cur, [prev, cur] = [cur, prev]) are not cell writes
const SETUP = /new Array|\.fill\(|Array\.from|\.slice\(|\[\.\.\.|^\s*(let\s+|const\s+)?[\w$]+\s*=\s*[\w$]+\s*;|^\s*\[[\w$, ]+\]\s*=/;

/** plain LCS length of two short strings (only used to tell prefix tables from suffix tables) */
function lcs(a, b) {
  let p = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    const c = [0];
    for (let j = 1; j <= b.length; j++) c[j] = a[i - 1] === b[j - 1] ? p[j - 1] + 1 : Math.max(p[j], c[j - 1]);
    p = c;
  }
  return p[b.length];
}

/** the one cell written between two snapshots: { name, i, j, v, grid?, other? } */
function changedCell(vars, prev, params) {
  for (const k of Object.keys(vars)) {
    if (params.includes(k)) continue;
    const a = vars[k];
    const b = prev[k];
    if (isGrid(a) && isGrid(b) && a.length === b.length) {
      const hits = [];
      a.forEach((r, i) => changedIdx(r, b[i]).forEach((j) => hits.push({ name: k, i, j, v: r[j], grid: a })));
      if (hits.length === 1) return hits[0];
    } else if (row(a) && row(b) && a.length === b.length) {
      const d = changedIdx(a, b);
      const [, i] = firstInt(vars, IDX);
      // the row above: another number row of the same length (prev while cur is written)
      const other = ROWNAMES.filter((n) => n !== k).map((n) => row(vars[n])).find((r) => r && r.length === a.length);
      if (d.length === 1 && Number.isInteger(i)) return { name: k, i, j: d[0], v: a[d[0]], row: a, other };
    }
  }
  return null;
}

/** +1 when the filled (non-zero) cells lie after (i, j) in reading order (a suffix table filled from the end), -1 before */
function fillSide(c) {
  let score = 0;
  const cells = c.grid.map((r, ri) => [ri, r]);
  for (const [r, vals] of cells) {
    vals.forEach((v, k) => {
      if (!v || (r === c.i && k === c.j)) return;
      score += r > c.i || (r === c.i && k > c.j) ? 1 : -1;
    });
  }
  return Math.sign(score);
}

/** how to read a cell: which word runs down the rows, and prefix or suffix (A[i:] vs B[j:]) tables */
function readCell(c, t1, t2) {
  if (!c || !Number.isInteger(c.v) || typeof t1 !== 'string' || typeof t2 !== 'string') return null;
  const width = (c.grid ? c.grid[0] : c.row).length;
  const flip = width === t1.length + 1 && width !== t2.length + 1;
  const [A, B] = flip ? [t2, t1] : [t1, t2];
  const { i, j } = c;
  if (i < 0 || j < 0 || i > A.length || j > B.length) return null;
  // a single rolling row keeps the old row beside the new cells, so only full tables show the fill direction
  const side = c.grid ? fillSide(c) : 0;
  // nothing filled yet: tell them apart by the value (short words only)
  const suffix = side > 0 || (side === 0 && A.length <= 40 && B.length <= 40 && lcs(A.slice(0, i), B.slice(0, j)) !== c.v && lcs(A.slice(i), B.slice(j)) === c.v);
  if (suffix ? i >= A.length || j >= B.length : i === 0 || j === 0) return { A, B, i, j, v: c.v, edge: true };
  const [pa, pb] = suffix ? [A.slice(i), B.slice(j)] : [A.slice(0, i), B.slice(0, j)];
  const [x, y] = suffix ? [A[i], B[j]] : [A[i - 1], B[j - 1]];
  const d = suffix ? 1 : -1;
  // "up" / "left" are the neighbours that drop A's / B's letter (below / right in a suffix table)
  let up;
  let left;
  let diag;
  if (c.grid) {
    up = c.grid[i + d]?.[j];
    left = c.grid[i]?.[j + d];
    diag = c.grid[i + d]?.[j + d];
  } else if (c.other) {
    up = c.other[j];
    diag = c.other[j + d];
    left = c.row[j + d];
  }
  return { A, B, i, j, v: c.v, pa, pb, x, y, up, left, diag, suffix };
}

const q = (s) => `'${s}'`;
const num = (v) => Number.isInteger(v);

export default {
  id: 'longest-common-subsequence',
  metaphor: 'Two words, one shared thread',
  caption: 'A cell is the longest letter thread two word pieces share, in order. Equal last letters add 1 to the diagonal; different ones keep the better of the cell above and the cell to the left.',
  pointers: ['j', 'c', 'col'],
  narrate(ctx) {
    const [n1, n2] = ctx.params;
    const t1 = ctx.vars[n1];
    const t2 = ctx.vars[n2];
    if (ctx.ret && num(ctx.value) && typeof t1 === 'string' && typeof t2 === 'string') return `the longest shared thread of ${q(t1)} and ${q(t2)} has ${ctx.value} letter${ctx.value === 1 ? '' : 's'}`;
    if (SETUP.test(ctx.src)) return null;
    const c = readCell(changedCell(ctx.vars, ctx.prev, ctx.params), t1, t2);
    if (!c) return null;
    if (c.edge) return c.v === 0 ? 'an empty piece shares nothing: 0' : null;
    const pair = `${q(c.pa)} vs ${q(c.pb)}`;
    if (c.x === c.y) return num(c.diag) && c.v === c.diag + 1 ? `${pair}: both have '${c.x}' → tie it on: diagonal ${c.diag} + 1 = ${c.v}` : `${pair}: both have '${c.x}' → ${c.v}`;
    if (num(c.up) && num(c.left) && c.v === Math.max(c.up, c.left)) {
      const [u, l] = c.suffix ? ['below', 'right'] : ['above', 'left'];
      const win = c.up === c.left ? `both ${c.v}` : c.up > c.left ? `${u} wins` : `${l} wins`;
      return `${pair}: '${c.x}' ≠ '${c.y}', drop a letter: ${u} ${c.up} or ${l} ${c.left}, ${win} → ${c.v}`;
    }
    return `${pair}: '${c.x}' ≠ '${c.y}', drop a letter from one word → ${c.v}`;
  },
  // before a non-trivial cell: a match that extends a thread, or a mismatch where above and left differ
  predict(ctx) {
    if (!ctx.next || SETUP.test(ctx.lines[ctx.next.line - 1] || '')) return null;
    const [n1, n2] = ctx.params;
    const c = readCell(changedCell(ctx.next.vars, ctx.vars, ctx.params), ctx.vars[n1], ctx.vars[n2]);
    if (!c || c.edge) return null;
    const ask = `How long is the shared thread of ${q(c.pa)} and ${q(c.pb)}?`;
    if (c.x === c.y && num(c.diag) && c.diag > 0) {
      return options(ask, c.v, [c.v + 1, c.v - 1, c.diag].filter((w) => w >= 0 && w !== c.v), `Both end in '${c.x}': match it and add 1 to the thread without those letters (${c.diag}).`);
    }
    if (c.x !== c.y && num(c.up) && num(c.left) && c.up !== c.left && Math.min(c.up, c.left) > 0) {
      return options(ask, c.v, [c.v + 1, Math.min(c.up, c.left), c.v - 1].filter((w) => w >= 0 && w !== c.v), `'${c.x}' ≠ '${c.y}': one of them is not in the thread, so keep the better of dropping '${c.x}' (${c.up}) or dropping '${c.y}' (${c.left}).`);
    }
    return null;
  },
  bugs: [
    {
      label: 'On a mismatch, take the diagonal',
      find: 'Math.max(prev[j], cur[j - 1])',
      replace: 'prev[j - 1]',
      explain: 'Dropping both letters at once forgets that one of them may still match later, so threads come out too short.',
    },
    {
      label: 'Compare text1[i] with text2[j]',
      find: 'text1[i - 1] === text2[j - 1]',
      replace: 'text1[i] === text2[j]',
      explain: 'Cell (i, j) covers the first i and j letters, so its last letters are at i − 1 and j − 1; off by one, it matches the wrong pair.',
    },
  ],
};
