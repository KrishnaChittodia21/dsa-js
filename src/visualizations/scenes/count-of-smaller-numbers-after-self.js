// Count of Smaller Numbers After Self. Walk from the right end with a tally board (a Fenwick tree / BIT over the
// values' ranks): each number first asks "how many numbers already seen are smaller than me?", then joins the board.
// Works with the toolkit FenwickTree ({ $obj: { tree } }), a hand-written BIT array, or a brute-force double loop.
import { cellAt, row, writtenCell } from './util.js';

const BIT = /^(bit|bits|ft|fen|fenwick|fw|tree|bitree)$/i;
const RES = /^(counts?|res|result|ans|answer|out|output|smaller)$/i;

/** the Fenwick node array: { t } (plain row or long-array snapshot), or null */
function bitOf(vars, params) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (params.includes(k) || !BIT.test(k)) continue;
    const o = v?.$obj;
    const t = o ? ['tree', 'bit', 't', 'arr', 'data'].map((f) => o[f]).find((x) => Array.isArray(x) || x?.$array) : v;
    if (Array.isArray(t) || t?.$array) return { name: k, t };
  }
  return null;
}
const lenOf = (t) => (Array.isArray(t) ? t.length : t?.$length ?? 0);
/** node indexes whose value changed between two snapshots of the BIT */
function grown(a, b) {
  if (!a || !b || lenOf(a) !== lenOf(b) || lenOf(b) > 4096) return [];
  const out = [];
  for (let i = 0; i < lenOf(b); i++) if (cellAt(a, i) !== cellAt(b, i)) out.push(i);
  return out;
}
const low = (j) => j & -j;
const block = (j) => (low(j) === 1 ? `${j}` : `${j - low(j) + 1}–${j}`);
const isNum = (x) => typeof x === 'number' && Number.isFinite(x);

/** the result cell written at this step: { name, i, v } */
function written(ctx, vars, prev, src) {
  const nums = row(ctx.input?.[0]);
  if (!nums) return null;
  const w = writtenCell(src, vars);
  if (w && RES.test(w.name) && w.at.length === 1 && !ctx.params.includes(w.name)) {
    const a = row(vars[w.name]);
    const i = w.at[0];
    if (a && a.length === nums.length && i >= 0 && i < a.length && isNum(a[i])) return { name: w.name, i, v: a[i] };
  }
  for (const [k, v] of Object.entries(vars)) {
    if (!RES.test(k) || ctx.params.includes(k)) continue;
    const a = row(v);
    const b = row(prev?.[k]);
    if (!a || !b || a.length !== nums.length || b.length !== a.length) continue;
    const d = a.map((x, i) => (x === b[i] ? -1 : i)).filter((i) => i >= 0);
    if (d.length === 1 && isNum(a[d[0]])) return { name: k, i: d[0], v: a[d[0]], was: b[d[0]] };
  }
  return null;
}
const smallerAfter = (nums, i) => nums.slice(i + 1).filter((x) => x < nums[i]).length;
const s = (k, w) => `${k} ${w}${k === 1 ? '' : 's'}`;

export default {
  id: 'count-of-smaller-numbers-after-self',
  metaphor: 'Walk from the right, tally who is shorter',
  caption: 'Numbers are read right to left. Each one asks the tally board how many numbers already seen (all to its right) are smaller, then adds itself to the board. The BIT row is the board: node j holds the count for a block of value ranks.',
  narrate(ctx) {
    const nums = row(ctx.input?.[0]);
    if (!nums) return null;
    const bit = bitOf(ctx.vars, ctx.params);
    const w = written(ctx, ctx.vars, ctx.prev, ctx.src);
    if (w) {
      const x = nums[w.i];
      const seen = nums.slice(w.i + 1);
      if (bit && !seen.length) return `${x} is the first number read: nothing seen yet, so 0 are smaller`;
      if (bit) return `how many seen so far (right of ${x}: [${seen.join(', ')}]) are smaller than ${x}? The board says ${w.v}`;
      const j = [ctx.vars.j, ctx.vars.k].find(Number.isInteger);
      if (w.was !== undefined && w.v === w.was + 1 && Number.isInteger(j) && j > w.i && nums[j] < x) return `${nums[j]} (to the right) is smaller than ${x}: ${x}'s tally → ${w.v}`;
      if (w.v === smallerAfter(nums, w.i)) return `${x} has ${s(w.v, 'smaller number')} to its right → ${w.v}`;
      return null;
    }
    if (bit) {
      const before = bitOf(ctx.prev, ctx.params);
      const g = grown(before?.t, bit.t).filter((j) => j > 0);
      const i = Number.isInteger(ctx.vars.i) && ctx.vars.i < nums.length ? ctx.vars.i : -1;
      if (before && !g.length && i >= 0 && ctx.vars.i !== ctx.prev.i) {
        // a fresh number arrives: its rank among the distinct values (0-based, as the reference computes it)
        const r = [...new Set(nums)].sort((a, b) => a - b).indexOf(nums[i]);
        const rk = Object.entries(ctx.vars).find(([k, v]) => /^(r|rk|rank|pos|idx|id)$/i.test(k) && v === r);
        if (rk) return `next, ${nums[i]}: it is the rank-${r} value, so smaller values sit in the slots below rank ${r}`;
        return null;
      }
      if (!before || !g.length) return null;
      const who = i >= 0 ? `${nums[i]} joins the board` : 'one more number joins the board';
      if (g.length === 1) return `${who}: node ${g[0]} (slots ${block(g[0])}) grows to ${cellAt(bit.t, g[0])}`;
      return `${who}: nodes ${g.join(', ')} grow (blocks ${g.map(block).join(', ')} all hold its rank)`;
    }
    return null;
  },
  // before the count of a number is written (BIT runs): how many seen numbers are smaller?
  predict(ctx) {
    const nums = row(ctx.input?.[0]);
    if (!nums || !ctx.next || !bitOf(ctx.vars, ctx.params)) return null;
    const lines = ctx.lines || [];
    const w = written(ctx, ctx.next.vars, ctx.vars, lines[ctx.next.line - 1]);
    if (!w || w.v !== smallerAfter(nums, w.i)) return null;
    const x = nums[w.i];
    const seen = nums.slice(w.i + 1);
    if (!seen.length) return null;
    const opts = [...new Set([w.v, 0, seen.length, seen.filter((y) => y <= x).length, w.v + 1])].filter((k) => k <= seen.length).sort((a, b) => a - b).slice(0, 4);
    if (!opts.includes(w.v)) return null;
    return {
      question: `The board holds the numbers to the right of ${x}: [${seen.join(', ')}]. How many of them are smaller than ${x}?`,
      options: opts.map(String),
      answer: opts.indexOf(w.v),
      explain: `A prefix sum over the ranks below ${x} counts exactly the seen numbers that are strictly smaller: ${seen.filter((y) => y < x).join(', ') || 'none'} → ${w.v}.`,
    };
  },
  bugs: [
    {
      label: 'prefixSum(r) counts equal numbers too',
      find: 'bit.prefixSum(r - 1)',
      replace: 'bit.prefixSum(r)',
      explain: 'prefixSum(r) includes rank r itself, so an equal number already seen on the right is counted as smaller: [-1, -1] gives [1, 0].',
    },
    {
      label: 'Scan left to right',
      find: 'for (let i = nums.length - 1; i >= 0; i--)',
      replace: 'for (let i = 0; i < nums.length; i++)',
      explain: 'Walking from the left, the board holds the numbers to the LEFT of each one, so it counts smaller numbers before it: [5, 2, 6, 1] gives [0, 0, 2, 0].',
    },
  ],
};
