// Count of Range Sum. A range nums[i..k−1] sums to P[k] − P[i] (running totals, P[0] = 0), so for every running total
// P[k] the question is: how many EARLIER totals lie in the window [P[k] − upper, P[k] − lower]? A Fenwick tree / BIT
// over the ranks of the totals counts the earlier ones. Works with the toolkit FenwickTree, a hand-written BIT, or
// the O(n²) "try every range" double loop.
import { cellAt, options, row } from './util.js';

const BIT = /^(bit|bits|ft|fen|fenwick|fw|tree|bitree)$/i;
const COUNT = ['count', 'cnt', 'res', 'result', 'ans', 'answer', 'total'];
const INDEX = ['k', 'i', 'j', 'end', 'r', 'idx'];

function bitOf(vars, params) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (params.includes(k) || !BIT.test(k)) continue;
    const o = v?.$obj;
    const t = o ? ['tree', 'bit', 't', 'arr', 'data'].map((f) => o[f]).find((x) => Array.isArray(x) || x?.$array) : v;
    if (Array.isArray(t) || t?.$array) return t;
  }
  return null;
}
const lenOf = (t) => (Array.isArray(t) ? t.length : t?.$length ?? 0);
function grown(a, b) {
  if (!a || !b || lenOf(a) !== lenOf(b) || lenOf(b) > 4096) return [];
  const out = [];
  for (let i = 1; i < lenOf(b); i++) if (cellAt(a, i) !== cellAt(b, i)) out.push(i);
  return out;
}
const low = (j) => j & -j;
const block = (j) => (low(j) === 1 ? `${j}` : `${j - low(j) + 1}–${j}`);

/** the running totals of the input, P[0] = 0 */
function totals(nums) {
  const P = [0];
  for (const x of nums) P.push(P[P.length - 1] + x);
  return P;
}
/** for the total P[k]: { k, t, lo, hi, earlier, inside } */
function windowAt(P, k, lower, upper) {
  const t = P[k];
  const earlier = P.slice(0, k);
  return { k, t, lo: t - upper, hi: t - lower, earlier, inside: earlier.filter((y) => y >= t - upper && y <= t - lower) };
}
const input = (ctx) => {
  const [nums, lower, upper] = ctx.input || [];
  return row(nums) && Number.isFinite(lower) && Number.isFinite(upper) ? { nums, lower, upper, P: totals(nums) } : null;
};
const counter = (vars, params) => COUNT.find((k) => !params.includes(k) && Number.isInteger(vars?.[k]));
/** the window whose size explains a count jump of d, found through the loop index */
function windowFor(vars, inp, d) {
  for (const n of INDEX) {
    const k = vars?.[n];
    if (!Number.isInteger(k) || k < 1 || k >= inp.P.length) continue;
    const w = windowAt(inp.P, k, inp.lower, inp.upper);
    if (w.inside.length === d) return w;
  }
  return null;
}
const paren = (x) => (x < 0 ? `(${x})` : `${x}`);
const list = (a) => (a.length > 10 ? `${a.length} totals` : `[${a.join(', ')}]`);

export default {
  id: 'count-of-range-sum',
  metaphor: 'Running totals: count earlier ones in a window',
  caption: 'P[k] is the running total of the first k numbers (P[0] = 0). A range ending before k is good when P[k] − P[i] is in [lower, upper], i.e. when the earlier total P[i] lies in [P[k] − upper, P[k] − lower]. The BIT row counts the earlier totals by rank.',
  narrate(ctx) {
    const inp = input(ctx);
    if (!inp) return null;
    const c = counter(ctx.vars, ctx.params);
    const d = c && Number.isInteger(ctx.prev[c]) ? ctx.vars[c] - ctx.prev[c] : 0;
    if (c && (d > 0 || (d === 0 && new RegExp(`\\b${c}\\s*\\+=`).test(ctx.src || '')))) {
      // brute force: one range at a time
      const [i, j] = [ctx.vars.i, ctx.vars.j];
      if (d === 1 && Number.isInteger(i) && Number.isInteger(j) && i <= j && j < inp.nums.length) {
        const s = inp.P[j + 1] - inp.P[i];
        if (s >= inp.lower && s <= inp.upper) return `nums[${i}..${j}] sums to ${s}, inside [${inp.lower}, ${inp.upper}]: count ${ctx.vars[c]}`;
      }
      const w = windowFor(ctx.vars, inp, d);
      if (w) return `total ${w.t}: earlier totals in [${w.lo}, ${w.hi}] are ${list(w.inside)} → ${d} range${d === 1 ? ' ends' : 's end'} here (count ${ctx.vars[c]})`;
      return null;
    }
    // the running totals being built: one more total pushed
    for (const [name, v] of Object.entries(ctx.vars)) {
      const a = row(v);
      const b = row(ctx.prev[name]);
      if (ctx.params.includes(name) || !a || !b || a.length !== b.length + 1 || a.length < 2 || a.length > inp.P.length) continue;
      if (a.every((x, i) => x === inp.P[i])) {
        const m = a.length - 1;
        return `running total P[${m}] = P[${m - 1}] + nums[${m - 1}] = ${a[m - 1]} + ${paren(inp.nums[m - 1])} = ${a[m]}`;
      }
    }
    const t = bitOf(ctx.vars, ctx.params);
    const g = grown(bitOf(ctx.prev, ctx.params), t);
    if (t && g.length) {
      const k = Number.isInteger(ctx.vars.k) && ctx.vars.k < inp.P.length ? ctx.vars.k : c in ctx.vars ? -1 : 0;
      const who = k >= 0 ? `total ${inp.P[k]}${k === 0 ? ' (the empty start)' : ''} joins the seen totals` : 'a total joins the seen totals';
      return g.length === 1 ? `${who}: node ${g[0]} (slots ${block(g[0])}) grows to ${cellAt(t, g[0])}` : `${who}: BIT nodes ${g.join(', ')} grow (blocks ${g.map(block).join(', ')})`;
    }
    // the window for a fresh total, read off the line that uses the bounds
    const upName = ctx.params[2];
    const k = ctx.vars.k;
    if (upName && Number.isInteger(k) && k >= 1 && k < inp.P.length && new RegExp(`\\b(${upName})\\b`).test(ctx.src || '') && /=/.test(ctx.src || '')) {
      const w = windowAt(inp.P, k, inp.lower, inp.upper);
      return `total P[${k}] = ${w.t}: a good range needs an earlier total between ${w.t} − ${paren(inp.upper)} = ${w.lo} and ${w.t} − ${paren(inp.lower)} = ${w.hi}`;
    }
    return null;
  },
  // right before the count grows by one total's share: how many earlier totals sit in its window?
  predict(ctx) {
    const inp = input(ctx);
    if (!inp || !ctx.next) return null;
    const c = counter(ctx.vars, ctx.params);
    const nx = ctx.next.vars;
    const src = (ctx.lines || [])[ctx.next.line - 1] || '';
    if (!c || !Number.isInteger(nx[c]) || !new RegExp(`\\b${c}\\s*\\+=`).test(src)) return null;
    const d = nx[c] - ctx.vars[c];
    const w = windowFor(nx, inp, d);
    if (!w || w.earlier.length < 2) return null;
    return options(
      `Total ${w.t}; earlier totals ${list(w.earlier)}. How many of them lie in the window [${w.lo}, ${w.hi}]?`,
      d,
      [w.earlier.length, d + 1, d - 1, 0].filter((x) => x >= 0 && x !== d),
      `Earlier totals between ${w.lo} and ${w.hi}: ${w.inside.join(', ') || 'none'}. Each one starts a range that ends here with a sum in [${inp.lower}, ${inp.upper}].`,
    );
  },
  bugs: [
    {
      label: 'if (lo < hi): one-slot windows skipped',
      find: 'if (lo <= hi) count += bit.rangeSum(lo, hi);',
      replace: 'if (lo < hi) count += bit.rangeSum(lo, hi);',
      explain: 'When exactly one distinct total fits the window, lo === hi and it is never counted: nums = [0], lower = upper = 0 gives 0 instead of 1.',
    },
    {
      label: 'P[0] = 0 never added to the board',
      find: 'bit.add(rank.get(P[0]), 1);',
      replace: '',
      explain: 'Without the empty start total 0 on the board, ranges that begin at index 0 are never counted: [-2, 5, -1] with [-2, 2] gives 1 instead of 3.',
    },
  ],
};
