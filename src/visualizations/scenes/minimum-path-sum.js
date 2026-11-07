// Minimum Path Sum: a cell's number is the cheapest total toll to walk to it from the top-left, moving only right
// or down: its own toll + the cheaper of the cell above and the cell to the left. Works with a rolling dp row, a
// full dp table (same size or with an extra border row / column) or the grid updated in place.
import { changedIdx, firstInt, row } from './util.js';

const ROW = ['r', 'i', 'row', 'y'];
const isGrid = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r));
const SETUP = /new Array|\.fill\(|Array\.from|\.map\(|\.slice\(|\[\.\.\./;
const fmt = (v) => (Number.isFinite(v) ? String(v) : '∞');

/**
 * the one cell written between two snapshots, in grid coordinates: { r, c, v, up, left } (up / left undefined when
 * that side is off the grid). Looks at the learner's tables and at the grid itself (in-place updates).
 */
function changedCell(vars, prev, params, input) {
  const m = input.length;
  const n = input[0]?.length || 0;
  for (const k of Object.keys(vars)) {
    const a = vars[k];
    const b = prev[k];
    if (params.includes(k) && k !== params[0]) continue;
    if (isGrid(a) && isGrid(b) && a.length === b.length) {
      const hits = [];
      a.forEach((rw, i) => changedIdx(rw, b[i]).forEach((j) => hits.push([i, j])));
      if (hits.length !== 1) continue;
      const off = a.length === m + 1 && a[0].length === n + 1 ? 1 : a.length === m && a[0].length === n ? 0 : -1;
      if (off < 0) continue;
      const [i, j] = hits[0];
      const [r, c] = [i - off, j - off];
      if (r < 0 || c < 0) continue;
      const side = (x) => (Number.isFinite(x) ? x : undefined);
      return { r, c, v: a[i][j], up: r > 0 ? side(a[i - 1][j]) : undefined, left: c > 0 ? side(a[i][j - 1]) : undefined };
    }
    if (k !== params[0] && row(a) && row(b) && a.length === b.length && (a.length === n || a.length === n + 1)) {
      const d = changedIdx(a, b);
      const [, r] = firstInt(vars, ROW);
      if (d.length !== 1 || !Number.isInteger(r) || r < 0 || r >= m) continue;
      const off = a.length - n;
      const c = d[0] - off;
      if (c < 0) continue;
      // the old value at this index is still last row's cost (above); the cell to its left is already this row's
      const up = r > 0 && Number.isFinite(b[d[0]]) ? b[d[0]] : undefined;
      const left = c > 0 && Number.isFinite(a[d[0] - 1]) ? a[d[0] - 1] : undefined;
      return { r, c, v: a[d[0]], up, left };
    }
  }
  return null;
}

/** the cell with its toll and which neighbour it came from (when the numbers add up) */
function readCell(ctx, vars, prev) {
  const input = ctx.input?.[0];
  if (!isGrid(input) || SETUP.test(ctx.src ?? '')) return null;
  const cell = changedCell(vars, prev, ctx.params, input);
  if (!cell || !Number.isFinite(cell.v)) return null;
  const toll = input[cell.r]?.[cell.c];
  if (!Number.isFinite(toll)) return null;
  const { up, left, v } = cell;
  const from = up !== undefined && left !== undefined ? (v === toll + Math.min(up, left) ? (up <= left ? 'up' : 'left') : null) : up !== undefined ? (v === toll + up ? 'up' : null) : left !== undefined ? (v === toll + left ? 'left' : null) : v === toll ? 'start' : null;
  return { ...cell, toll, from };
}

export default {
  id: 'minimum-path-sum',
  metaphor: 'The cheapest walk through toll squares',
  caption: 'Each square charges its toll. A number in the table is the cheapest total to walk there from the top-left, moving only right or down: the toll plus the cheaper of the square above and the square to the left.',
  narrate(ctx) {
    if (ctx.ret && Number.isFinite(ctx.value)) return `the bottom-right corner costs ${ctx.value} at best: that is the cheapest walk`;
    const c = readCell({ ...ctx }, ctx.vars, ctx.prev);
    if (!c) return null;
    const at = `(${c.r}, ${c.c})`;
    if (c.from === 'start') return `${at} is the start: you pay its toll ${c.toll}`;
    if (!c.from) return `${at}: toll ${c.toll}, cheapest so far ${fmt(c.v)}`;
    if (c.up !== undefined && c.left !== undefined) {
      const pick = c.up === c.left ? `both ${c.up}` : `take ${Math.min(c.up, c.left)}`;
      return `${at}: from above ${c.up} or from the left ${c.left}, ${pick} + this toll ${c.toll} = ${c.v}`;
    }
    return c.from === 'up' ? `${at}: first column, only from above: ${c.up} + toll ${c.toll} = ${c.v}` : `${at}: top row, only from the left: ${c.left} + toll ${c.toll} = ${c.v}`;
  },
  // before a square with two ways in that cost differently: which one does the cheapest walk use?
  predict(ctx) {
    if (!ctx.next || SETUP.test(ctx.lines[ctx.next.line - 1] || '')) return null;
    const c = readCell({ ...ctx, src: ctx.lines[ctx.next.line - 1] }, ctx.next.vars, ctx.vars);
    if (!c || c.up === undefined || c.left === undefined || c.up === c.left || !c.from) return null;
    const opts = [`From above (${c.up})`, `From the left (${c.left})`];
    return {
      question: `Square (${c.r}, ${c.c}) charges ${c.toll}. The cheapest walk into it comes…`,
      options: opts,
      answer: c.from === 'up' ? 0 : 1,
      explain: `Only the cheaper way in matters: ${Math.min(c.up, c.left)} + ${c.toll} = ${c.v}. Picking by the next toll alone (greedy) can miss this.`,
    };
  },
  bugs: [
    {
      label: 'Start the row at 0 instead of ∞',
      find: 'new Array(n).fill(Infinity)',
      replace: 'new Array(n).fill(0)',
      explain: 'On the top row, "the square above" is off the grid, but a 0 there looks like a free way in, so the top-row walk costs too little.',
    },
    {
      label: 'Forget the start square',
      find: 'dp[0] += grid[r][0];',
      replace: 'if (r > 0) dp[0] += grid[r][0];',
      explain: 'The first square\'s toll is never paid, so every walk comes out short by exactly that toll.',
    },
  ],
};
