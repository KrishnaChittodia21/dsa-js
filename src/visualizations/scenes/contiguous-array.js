// Contiguous Array (prefix balance + first-seen Map). A hiker steps up on every 1 and down on every 0; standing at a
// height seen before means the stretch in between had as many ups as downs. Works with any name for the balance
// (balance/sum/count/…) and for the height → first index Map.
import { firstInt, options, row } from './util.js';

const HEIGHT = ['balance', 'bal', 'sum', 'count', 'cnt', 'prefix', 'diff', 'cur', 'curr', 'running', 'height'];
const AT = ['i', 'j', 'idx', 'k'];
const BEST = ['best', 'max', 'maxLen', 'ans', 'res', 'result', 'longest', 'maxLength'];
// height → first index: a $map of integers to integers
const firstOf = (vars) => Object.entries(vars).find(([, v]) => v && Array.isArray(v.$map) && v.$map.every((e) => Number.isInteger(e[0]) && Number.isInteger(e[1])));
const asMap = (v) => new Map(v && Array.isArray(v.$map) ? v.$map : []);
const bestOf = (vars) => BEST.find((n) => Number.isInteger(vars[n]));

export default {
  id: 'contiguous-array',
  metaphor: 'A hiker back at the same height',
  caption: 'Every 1 is a step up, every 0 a step down. The Map remembers where each height was first reached; coming back to that height means the trees in between were half 1s, half 0s.',
  compare: 'best',
  narrate(ctx) {
    const nums = row(ctx.vars[ctx.params[0]]);
    if (!nums) return null;
    const [hName, h] = firstInt(ctx.vars, HEIGHT);
    const [, i] = firstInt(ctx.vars, AT);
    const f = firstOf(ctx.vars);
    const seen = f ? asMap(f[1]) : new Map();
    if (hName && hName in ctx.prev && h !== ctx.prev[hName] && Number.isInteger(i) && i >= 0 && i < nums.length) {
      const move = h > ctx.prev[hName] ? `nums[${i}] = ${nums[i]}: step up` : `nums[${i}] = ${nums[i]}: step down`;
      if (f && seen.has(h)) return `${move} to height ${h}: back at a height reached before, so the stretch since then is balanced`;
      return `${move} to height ${h}${f ? ', a height never reached before' : ''}`;
    }
    if (f) {
      const was = asMap(ctx.prev[f[0]]);
      const fresh = [...seen].find(([k]) => !was.has(k));
      if (fresh && f[0] in ctx.prev) return fresh[1] < 0 ? `the hike starts at height ${fresh[0]}, just before index 0` : `remember: height ${fresh[0]} was first reached at index ${fresh[1]} (later visits keep this earliest index)`;
    }
    const b = bestOf(ctx.vars);
    if (b && Number.isInteger(ctx.prev[b]) && ctx.vars[b] > ctx.prev[b]) {
      const L = ctx.vars[b];
      return `new longest balanced stretch: ${Number.isInteger(i) ? `indexes ${i - L + 1}..${i}, ` : ''}${L} numbers, half 1s and half 0s`;
    }
    return null;
  },
  // back at a known height, and the best is about to grow: to what?
  predict(ctx) {
    const [, h] = firstInt(ctx.vars, HEIGHT);
    const [, i] = firstInt(ctx.vars, AT);
    const f = firstOf(ctx.vars);
    const b = bestOf(ctx.vars);
    if (!ctx.next || !f || !b || h === undefined || !Number.isInteger(i)) return null;
    const seen = asMap(f[1]);
    const nb = ctx.next.vars[b];
    if (!seen.has(h) || !Number.isInteger(nb) || nb <= ctx.vars[b]) return null;
    const at = seen.get(h);
    return options(`Height ${h} again at index ${i}; it was first reached at index ${at}${at < 0 ? ' (before the start)' : ''}. What does the best length become?`, nb, [ctx.vars[b], nb + 1, Math.max(0, nb - 1)], `The balanced stretch is indexes ${at + 1}..${i}: ${i} − ${at} = ${i - at} numbers, longer than the old best ${ctx.vars[b]}.`);
  },
  bugs: [
    {
      label: 'Forget the seed: height 0 at index −1',
      find: 'new Map([[0, -1]])',
      replace: 'new Map()',
      explain: 'Height 0 before the first number is never remembered, so a balanced stretch that starts at index 0 (like the whole of [0, 1]) is missed.',
    },
    {
      label: 'Count 0 as 0 instead of −1',
      find: 'nums[i] === 1 ? 1 : -1',
      replace: 'nums[i] === 1 ? 1 : 0',
      explain: 'A 0 no longer steps down, so equal heights mean "only 0s in between", not "as many 1s as 0s".',
    },
  ],
};
