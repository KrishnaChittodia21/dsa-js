// Longest Increasing Subsequence. Patience sorting: a `tails` row where slot k holds the smallest number that can end
// a rising run of k + 1; each number either starts a new slot (bigger than every tail) or replaces the first tail
// that is not smaller. Also reads the O(n²) version: dp[i] = the longest rising run ending at nums[i].
import { changedIdx, firstInt, options, row, writtenCell } from './util.js';

const VAL = ['x', 'num', 'v', 'val', 'cur', 'card', 'value', 'el', 'e', 'target', 'n0'];
const IDX = ['i', 'k', 'idx', 'index'];
const BACK = ['j', 'p', 'k', 'prev', 'q'];
const MID = ['mid', 'm', 'middle'];
const LO = ['lo', 'left', 'l', 'low', 'start'];
const HI = ['hi', 'right', 'r', 'high', 'end'];
const nums = (v) => !!row(v) && v.every((x) => typeof x === 'number');
const incr = (a) => a.every((x, k) => k === 0 || a[k - 1] < x);
const same = (a, b) => a.length === b.length && a.every((x, k) => x === b[k]);

/** the number being placed: a value-like variable, else nums[i] */
function valueOf(vars, arr) {
  const [vn, v] = firstInt(vars, VAL);
  if (vn) return v;
  const [, i] = firstInt(vars, IDX);
  return Number.isInteger(i) && arr ? arr[i] : undefined;
}

/** a tails write between two snapshots: { name, slot, x, old (undefined = new slot), tails } */
function tailsStep(vars, prev, src, params, arr) {
  if (!arr) return null;
  for (const [k, a] of Object.entries(vars)) {
    if (params.includes(k) || !nums(a) || !incr(a) || !nums(prev[k])) continue;
    const b = prev[k];
    if (a.length === b.length + 1 && same(a.slice(0, -1), b) && arr.includes(a[a.length - 1])) return { name: k, slot: b.length, x: a[a.length - 1], tails: a };
    const d = changedIdx(a, b);
    if (d.length === 1 && a[d[0]] < b[d[0]] && arr.includes(a[d[0]])) return { name: k, slot: d[0], x: a[d[0]], old: b[d[0]], tails: a };
    // the same number written over itself (a duplicate)
    const w = writtenCell(src, vars);
    if (d.length === 0 && w && w.name === k && w.at.length === 1 && a.length !== arr.length) return { name: k, slot: w.at[0], x: a[w.at[0]], old: a[w.at[0]], tails: a, dup: true };
  }
  return null;
}

/** an O(n²) dp write: { i, j, v, old, back } (back = dp[j]) */
function dpStep(vars, prev, src, params, arr) {
  const w = writtenCell(src, vars);
  if (!w || !arr || params.includes(w.name) || w.at.length !== 1) return null;
  const d = vars[w.name];
  if (!nums(d) || d.length !== arr.length || !nums(prev[w.name])) return null;
  const i = w.at[0];
  const [, j] = firstInt(vars, BACK.filter((k) => vars[k] !== i));
  return { i, j: Number.isInteger(j) && j < i ? j : undefined, v: d[i], old: prev[w.name][i], back: Number.isInteger(j) ? d[j] : undefined, dp: d };
}

const tailsRow = (vars, params) => Object.entries(vars).find(([k, a]) => !params.includes(k) && /tail|pile|sub|seq|stack|lis|top|end|res|d/i.test(k) && nums(a) && incr(a));

export default {
  id: 'longest-increasing-subsequence',
  metaphor: 'Dealing numbers onto rising piles',
  caption: 'Slot k of the tails row holds the smallest number that can end a rising run of k + 1. A number bigger than every tail opens a new slot; otherwise it replaces the first tail that is not smaller, so that run can end lower. The number of slots is the answer.',
  pointers: [...LO, ...HI, ...MID, 'i', 'j'],
  narrate(ctx) {
    const an = ctx.params[0];
    const arr = row(ctx.vars[an]) || row(ctx.input?.[0]);
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.value)) return `the longest rising run has ${ctx.value} number${ctx.value === 1 ? '' : 's'}`;
    const t = tailsStep(ctx.vars, ctx.prev, ctx.src, ctx.params, arr);
    if (t) {
      if (t.dup) return `${t.x} is already the tail of slot ${t.slot}: nothing changes (the run must rise strictly)`;
      if (t.old === undefined) return t.slot === 0 ? `${t.x} starts slot 0: a run of 1` : `${t.x} is bigger than every tail: it opens slot ${t.slot}, a rising run of ${t.slot + 1} exists`;
      return `${t.x} replaces ${t.old} at slot ${t.slot}: a run of ${t.slot + 1} can now end lower`;
    }
    const d = dpStep(ctx.vars, ctx.prev, ctx.src, ctx.params, arr);
    if (d && Number.isInteger(d.v)) {
      if (d.j === undefined) return d.v === 1 ? `${arr[d.i]} alone: a run of 1` : null;
      const who = `${arr[d.i]} (cell ${d.i}) after ${arr[d.j]} (cell ${d.j}, run ${d.back})`;
      if (arr[d.j] >= arr[d.i]) return null;
      return d.v !== d.old ? `${who}: a longer run, ${d.v}` : `${who}: only ${d.back + 1}, keep ${d.v}`;
    }
    // the binary search for the slot
    const tr = tailsRow(ctx.vars, ctx.params);
    const x = valueOf(ctx.vars, arr);
    if (!tr || !Number.isInteger(x)) return null;
    const tails = tr[1];
    const [mn, m] = firstInt(ctx.vars, MID);
    if (ctx.next && tailsStep(ctx.next.vars, ctx.vars, ctx.lines?.[ctx.next.line - 1], ctx.params, arr)) return null;
    const [ln, lo] = firstInt(ctx.vars, LO);
    const [hn, hi] = firstInt(ctx.vars, HI);
    if (mn && m !== ctx.prev[mn] && m >= 0 && m < tails.length) return `where does ${x} go? check slot ${m}: its tail is ${tails[m]}`;
    if (mn && ln && ln in ctx.prev && lo !== ctx.prev[ln] && Number.isInteger(tails[m])) return `${tails[m]} < ${x}: ${x} goes right of slot ${m}`;
    if (mn && hn && hn in ctx.prev && hi !== ctx.prev[hn] && Number.isInteger(tails[m])) return `${tails[m]} ≥ ${x}: slot ${m} or further left`;
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const arr = row(ctx.vars[ctx.params[0]]) || row(ctx.input?.[0]);
    const nsrc = ctx.lines?.[ctx.next.line - 1];
    const t = tailsStep(ctx.next.vars, ctx.vars, nsrc, ctx.params, arr);
    if (t) {
      const before = row(ctx.vars[t.name]);
      if (!before || before.length < 2) return null;
      const label = (k) => (k >= before.length ? `It opens a new slot ${k}` : `It replaces ${before[k]} at slot ${k}`);
      const wrong = [before.length, t.slot - 1, t.slot + 1, 0].filter((k) => k >= 0 && k <= before.length && k !== t.slot).map(label);
      return options(
        `Tails are [${before.join(', ')}]. Where does ${t.x} go?`,
        label(t.slot),
        wrong,
        t.slot >= before.length ? `${t.x} is bigger than every tail, so it makes a run one longer than any before.` : `${before[t.slot]} is the first tail that is not smaller than ${t.x}; putting ${t.x} there lets a run of ${t.slot + 1} end lower.`,
      );
    }
    const d = dpStep(ctx.next.vars, ctx.vars, nsrc, ctx.params, arr);
    if (!d || d.j === undefined || !Number.isInteger(d.v) || !Number.isInteger(d.back) || !(arr[d.j] < arr[d.i]) || Math.max(d.back, d.old) < 2) return null;
    return options(
      `${arr[d.i]} (cell ${d.i}) looks back at ${arr[d.j]} (cell ${d.j}), whose run is ${d.back}. How long is the best run ending at ${arr[d.i]} now?`,
      d.v,
      [d.old, d.back + 1, d.back, d.v + 1].filter((w) => Number.isInteger(w) && w !== d.v),
      d.v !== d.old ? `${arr[d.j]} < ${arr[d.i]}, so ${arr[d.i]} can follow its run: ${d.back} + 1 = ${d.v}, longer than ${d.old}.` : `Following ${arr[d.j]} gives only ${d.back + 1}; an earlier number already gave ${d.v}.`,
    );
  },
  bugs: [
    {
      label: 'Upper bound: equal tails are passed',
      find: 'tails[mid] < x',
      replace: 'tails[mid] <= x',
      explain: 'An equal number then lands after its twin and opens a new slot, so [7, 7, 7, 7] counts a run of 4: the run must rise strictly.',
    },
    {
      label: 'Never lower a tail',
      find: 'tails[lo] = x;',
      replace: 'if (lo === tails.length) tails.push(x);',
      explain: 'Without replacing, 10 stays the tail of slot 0 and 2, 5, 3 are thrown away: [10, 9, 2, 5, 3, 7, 101, 18] gives 2 instead of 4.',
    },
  ],
};
