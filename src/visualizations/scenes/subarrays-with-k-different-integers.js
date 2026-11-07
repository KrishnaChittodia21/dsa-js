// Subarrays with K Different Integers (exactly k = at most k − at most k−1). A shelf of tins with a limit on how many
// different labels the window may hold: every time the right end moves, each start from left to right gives one more
// good subarray. Works with any name for the value → count Map and left/l/start/i, right/r/end/j.
import { options, row } from './util.js';

const PAIRS = [
  ['left', 'right'],
  ['l', 'r'],
  ['start', 'end'],
  ['i', 'j'],
  ['lo', 'hi'],
];
const LIMIT = ['K', 'limit', 'maxDistinct', 'kk', 'x', 'k'];
const TOTAL = ['total', 'count', 'res', 'ans', 'result', 'cnt', 'sum', 'acc'];
const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
const mapOf = (vars) => Object.entries(vars).find(([, v]) => v && Array.isArray(v.$map) && v.$map.every((e) => Number.isInteger(e[1])));
const kinds = (m) => [...m.values()].filter((c) => c > 0).length;
const intName = (vars, names) => names.find((n) => Number.isInteger(vars[n]));

export default {
  id: 'subarrays-with-k-different-integers',
  metaphor: 'A shelf window with a label limit',
  caption: 'The bracket may hold at most K different labels. Each time it grows to the right, every start inside it gives one more good subarray; exactly k = (at most k) − (at most k − 1).',
  range: PAIRS,
  pointers: PAIRS.flat(),
  narrate(ctx) {
    const [nName, kName] = ctx.params;
    const nums = row(ctx.vars[nName]);
    if (!nums) return null;
    const m = mapOf(ctx.vars);
    const pair = pairOf(ctx.vars);
    if (!m && !pair && Number.isInteger(ctx.vars[kName]) && ctx.index === 0) {
      const k = ctx.vars[kName];
      return `exactly ${k} labels = (windows with at most ${k}) − (windows with at most ${k - 1}): count both and subtract`;
    }
    if (!m || !pair) return null;
    const [lName, rName] = pair;
    const l = ctx.vars[lName];
    const r = ctx.vars[rName];
    const lim = intName(ctx.vars, LIMIT);
    const K = lim ? ctx.vars[lim] : undefined;
    const tName = intName(ctx.vars, TOTAL.filter((n) => n !== lim));
    if (tName && Number.isInteger(ctx.prev[tName]) && ctx.vars[tName] > ctx.prev[tName]) {
      const d = ctx.vars[tName] - ctx.prev[tName];
      return `${d} good subarray${d === 1 ? ' ends' : 's end'} at ${r} (one per start ${l}..${r}): ${tName} = ${ctx.vars[tName]}`;
    }
    const now = new Map(m[1].$map);
    const wasRaw = ctx.prev[m[0]];
    if (!wasRaw || !Array.isArray(wasRaw.$map)) return null;
    const was = new Map(wasRaw.$map);
    for (const [v, c] of now) {
      const old = was.get(v) ?? 0;
      if (c === old + 1) return `take ${v} at ${r}: the window holds ${kinds(now)} different label${kinds(now) === 1 ? '' : 's'}${K !== undefined ? ` (limit ${K})` : ''}${K !== undefined && kinds(now) > K ? ': too many, drop from the left' : ''}`;
      if (c === old - 1) return `drop a ${v} from the left${c === 0 ? `: no ${v} left in the window` : ` (${c} left)`}`;
    }
    for (const [v] of was) if (!now.has(v)) return `label ${v} is gone: the window holds ${kinds(now)} different label${kinds(now) === 1 ? '' : 's'}${K !== undefined ? ` (limit ${K})` : ''}`;
    return null;
  },
  // before the count grows: how many good subarrays end at the right end?
  predict(ctx) {
    if (!ctx.next) return null;
    const pair = pairOf(ctx.vars);
    const m = mapOf(ctx.vars);
    if (!pair || !m) return null;
    const [lName, rName] = pair;
    const lim = intName(ctx.vars, LIMIT);
    const tName = intName(ctx.vars, TOTAL.filter((n) => n !== lim));
    if (!tName || !Number.isInteger(ctx.next.vars[tName])) return null;
    const l = ctx.vars[lName];
    const r = ctx.vars[rName];
    const d = ctx.next.vars[tName] - ctx.vars[tName];
    if (d < 2 || ctx.next.vars[lName] !== l || ctx.next.vars[rName] !== r) return null;
    return options(`The window is ${l}..${r} and fits the limit. How many good subarrays end at ${r}?`, d, [1, r + 1, d + 1, d - 1].filter((x) => x > 0), `Every start from ${l} to ${r} gives a subarray inside the window, so it adds ${r} − ${l} + 1 = ${d}.`);
  },
  bugs: [
    {
      label: 'Count 1 per window instead of right − left + 1',
      find: 'total += right - left + 1',
      replace: 'total += 1',
      explain: 'Only the longest subarray ending at each right end is counted; the shorter ones starting further right are lost.',
    },
    {
      label: 'if instead of while: drop only one from the left',
      find: 'while (count.size > K)',
      replace: 'if (count.size > K)',
      explain: 'One drop may not bring the labels back under the limit, so windows with too many labels get counted.',
    },
  ],
};
