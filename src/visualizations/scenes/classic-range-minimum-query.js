// Static Range Minimum Query (sparse table). Level k of the table holds the minimum of every block of 2^k numbers,
// built from two blocks of half the size. A query [l..r] picks the largest power of two that fits and covers the
// range with two overlapping blocks of that size: overlap is harmless for a minimum. Works with st[k][i] tables, a
// row built per level, and loops or queries.map; a brute-force scan falls back to the generic notes.
import { options, row, writtenCell } from './util.js';

const PAIRS = [['l', 'r'], ['left', 'right'], ['lo', 'hi'], ['L', 'R'], ['a', 'b'], ['s', 'e'], ['start', 'end'], ['x', 'y']];
const LEVEL = ['k', 'j', 'p', 'lg', 'lv', 'level', 'lvl', 'pw', 'power'];
const isNum = (x) => typeof x === 'number' && Number.isFinite(x);
const minOf = (a, i, len) => Math.min(...a.slice(i, i + len));
const span = (i, len) => (len === 1 ? `[${i}]` : `[${i}..${i + len - 1}]`);

function inputOf(ctx) {
  const [nums, queries] = ctx.input || [];
  return row(nums) && nums.length && Array.isArray(queries) ? { nums, queries } : null;
}
/** the query bounds in these variables: [l, r] */
function boundsOf(vars, n) {
  const p = PAIRS.find(([a, b]) => Number.isInteger(vars?.[a]) && Number.isInteger(vars?.[b]) && vars[a] >= 0 && vars[a] <= vars[b] && vars[b] < n);
  return p ? [vars[p[0]], vars[p[1]]] : null;
}
/** the block level a query uses, from a variable holding k (2^k ≤ length < 2^(k+1)) */
function levelOf(vars, len) {
  const name = LEVEL.find((n) => Number.isInteger(vars?.[n]) && vars[n] >= 0 && 2 ** vars[n] <= len && len < 2 ** (vars[n] + 1));
  return name === undefined ? null : vars[name];
}
/** the table cell this step wrote: { level, i, v } (st[k][i] = …, or row[i] = … with the level from the row length) */
function cellWritten(ctx, vars, src, n) {
  const w = writtenCell(src, vars);
  if (!w || ctx.params.includes(w.name)) return null;
  const t = vars[w.name];
  if (w.at.length === 2 && Array.isArray(t) && row(t[w.at[0]])) return { level: w.at[0], i: w.at[1], v: t[w.at[0]][w.at[1]] };
  if (w.at.length !== 1 || !row(t)) return null;
  const size = n - t.length + 1; // level k has n − 2^k + 1 starts
  let level = Number.isInteger(Math.log2(size)) && size > 1 ? Math.log2(size) : null;
  if (level === null && t.length === n) level = LEVEL.map((k) => vars[k]).find((x) => Number.isInteger(x) && x >= 1 && 2 ** x <= n) ?? null;
  return level === null ? null : { level, i: w.at[0], v: t[w.at[0]] };
}
/** the answer a step produces for a query: a returned number, or a number pushed onto a result list */
function answerOf(step, before, params) {
  if (!step) return undefined;
  if (step.ret && isNum(step.value)) return step.value;
  for (const [k, v] of Object.entries(step.vars || {})) {
    const a = row(v);
    const b = row(before?.[k]);
    if (!params.includes(k) && a && b && a.length === b.length + 1 && isNum(a[a.length - 1])) return a[a.length - 1];
  }
  return undefined;
}

export default {
  id: 'classic-range-minimum-query',
  metaphor: 'Two overlapping blocks cover any range',
  caption: 'Row k of the table holds the minimum of every block of 2^k numbers, each made from two blocks of half the size. A query takes the biggest block size that fits and lays one block at each end: they may overlap, which a minimum does not mind.',
  narrate(ctx) {
    const inp = inputOf(ctx);
    if (!inp) return null;
    const { nums } = inp;
    const n = nums.length;
    const c = cellWritten(ctx, ctx.vars, ctx.src, n);
    if (c && c.level >= 1 && isNum(c.v)) {
      const len = 2 ** c.level;
      const half = len / 2;
      if (c.i < 0 || c.i + len > n || c.v !== minOf(nums, c.i, len)) return null;
      return `block ${span(c.i, len)} (${len} numbers): min of halves ${span(c.i, half)} = ${minOf(nums, c.i, half)} and ${span(c.i + half, half)} = ${minOf(nums, c.i + half, half)} → ${c.v}`;
    }
    const lr = boundsOf(ctx.vars, n);
    if (!lr) return null;
    const [l, r] = lr;
    const len = r - l + 1;
    const k = levelOf(ctx.vars, len);
    const ans = ctx.ret ? (isNum(ctx.value) ? ctx.value : undefined) : answerOf({ vars: ctx.vars }, ctx.prev, ctx.params);
    if (k !== null && ans !== undefined) {
      const b = 2 ** k;
      if (ans !== minOf(nums, l, len)) return null;
      return `query ${span(l, len)}: min(block ${span(l, b)} = ${minOf(nums, l, b)}, block ${span(r - b + 1, b)} = ${minOf(nums, r - b + 1, b)}) = ${ans}`;
    }
    if (k === null && ans !== undefined && ans === minOf(nums, l, len)) return `query ${span(l, len)}: scanned all ${len} number${len > 1 ? 's' : ''} → min ${ans} (a table would answer with two reads)`;
    const kName = LEVEL.find((x) => ctx.vars[x] === k);
    if (k !== null && (ctx.vars[kName] !== ctx.prev[kName] || new RegExp(`\\b${kName}\\s*=(?!=)`).test(ctx.src || ''))) {
      const b = 2 ** k;
      if (len === b) return `query ${span(l, len)}: ${len} number${len > 1 ? 's' : ''}, exactly one block of ${b} (both blocks are the same one)`;
      return `query ${span(l, len)}: ${len} numbers, the biggest block that fits is ${b}, so use ${span(l, b)} and ${span(r - b + 1, b)}`;
    }
    return null;
  },
  // before a query starts: which block size? once the blocks are chosen: what is the minimum?
  predict(ctx) {
    const inp = inputOf(ctx);
    if (!inp || !ctx.next) return null;
    const { nums } = inp;
    const n = nums.length;
    const nv = ctx.next.vars;
    const lr = boundsOf(nv, n);
    if (!lr) return null;
    const [l, r] = lr;
    const len = r - l + 1;
    const k = levelOf(nv, len);
    if (k === null || len < 2) return null;
    const b = 2 ** k;
    // the level variable is just being computed (it was not there, or held another query's value)
    const kName = LEVEL.find((x) => nv[x] === k);
    const curLr = boundsOf(ctx.vars, n);
    const freshQuery = !curLr || curLr[0] !== l || curLr[1] !== r || ctx.vars[kName] !== k;
    if (freshQuery && answerOf(ctx.next, ctx.vars, ctx.params) === undefined) {
      if (len === b) return null; // a power-of-two length is one exact block: too easy
      return options(
        `Query ${span(l, len)} has ${len} numbers. Which block size do its two overlapping blocks use?`,
        b,
        [b / 2, b * 2, len].filter((x) => x >= 1 && x !== b),
        `The biggest power of two that fits in ${len} is ${b}: blocks ${span(l, b)} and ${span(r - b + 1, b)} overlap but together cover the whole range.`,
      );
    }
    const ans = answerOf(ctx.next, ctx.vars, ctx.params);
    if (freshQuery || ans === undefined || ans !== minOf(nums, l, len)) return null;
    const m1 = minOf(nums, l, b);
    const m2 = minOf(nums, r - b + 1, b);
    return options(
      `Query ${span(l, len)}: block ${span(l, b)} and block ${span(r - b + 1, b)}. Read their minimums in row ${k}: what is the answer?`,
      ans,
      [nums[l], nums[r], Math.max(m1, m2), Math.max(...nums.slice(l, r + 1))].filter((x) => x !== ans),
      `Row ${k} says block ${span(l, b)} has min ${m1} and block ${span(r - b + 1, b)} has min ${m2}; the smaller, ${ans}, is the range minimum.`,
    );
  },
  bugs: [
    {
      label: 'Second block starts at r − 2^k',
      find: 'st[k][r - (1 << k) + 1]',
      replace: 'st[k][r - (1 << k)]',
      explain: 'The right block ends at r − 1, so nums[r] is never looked at (and r − 2^k can fall before the range): query [5, 6] of [4, 6, 1, 5, 7, 3, 2] gives 5 instead of 2.',
    },
  ],
};
