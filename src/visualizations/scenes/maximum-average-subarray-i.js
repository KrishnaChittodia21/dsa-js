// Maximum Average Subarray I (fixed sliding window). A frame exactly k cells wide slides along the numbers: one
// value enters on the right, one leaves on the left, and only the best frame sum is kept (divide by k at the end).
// Works with any name for the running sum (windowSum/sum/cur…), the best sum (maxSum/best/max…) and the index.
import { firstInt, options, row } from './util.js';

const SUM = ['windowSum', 'sum', 'curSum', 'currSum', 'currentSum', 'winSum', 'cur', 'curr', 'current', 'total', 'window', 's'];
const BEST = ['maxSum', 'best', 'bestSum', 'max', 'maxS', 'mx', 'maxi', 'ans', 'res', 'result'];
const IDX = ['right', 'r', 'end', 'i', 'j', 'hi'];
const num = (v) => typeof v === 'number' && Number.isFinite(v);
const avg = (s, k) => String(Math.round((s / k) * 1000) / 1000);

export default {
  id: 'maximum-average-subarray-i',
  metaphor: 'A k-wide frame sliding along a ruler',
  caption: 'The frame always covers exactly k numbers. Each slide adds the number entering on the right and subtracts the one leaving on the left; the best frame sum is kept and divided by k once at the end.',
  pointers: IDX,
  compare: 'maxSum',
  narrate(ctx) {
    const [aName, kName] = ctx.params;
    const a = row(ctx.vars[aName]);
    const k = ctx.vars[kName];
    if (!a || !Number.isInteger(k) || k < 1) return null;
    const [, idx] = firstInt(ctx.vars, IDX);
    const sName = SUM.find((n) => num(ctx.vars[n]));
    const bName = BEST.find((n) => num(ctx.vars[n]) || ctx.vars[n] === -Infinity);
    if (bName && ctx.vars[bName] !== ctx.prev[bName] && num(ctx.vars[bName])) {
      const b = ctx.vars[bName];
      if (!(bName in ctx.prev)) return `the first frame sums to ${b}: it is the best so far (average ${avg(b, k)})`;
      return `new best frame: sum ${b}, average ${avg(b, k)}`;
    }
    const code = ctx.lines[ctx.line - 1] || '';
    if (bName && sName && ctx.vars[sName] <= ctx.vars[bName] && new RegExp(`\\b${bName}\\s*=[^=]`).test(code)) return `this frame (sum ${ctx.vars[sName]}) does not beat the best (${ctx.vars[bName]}): keep the best`;
    if (!sName || !num(ctx.prev[sName]) || ctx.vars[sName] === ctx.prev[sName]) return null;
    const s = ctx.vars[sName];
    const d = s - ctx.prev[sName];
    if (!Number.isInteger(idx) || idx < 0 || idx >= a.length) return null;
    if (idx < k && d === a[idx]) return `fill the first frame: ${a[idx]} (cell ${idx}) goes in, sum ${s}`;
    if (idx >= k && d === a[idx] - a[idx - k]) return `slide right: ${a[idx]} enters, ${a[idx - k]} leaves → cells ${idx - k + 1}..${idx} sum to ${s}`;
    if (idx >= k && d === a[idx]) return `${a[idx]} (cell ${idx}) enters the frame on the right: sum ${s}`;
    if (idx >= k && d === -a[idx - k]) return `${a[idx - k]} (cell ${idx - k}) leaves the frame on the left: sum ${s}`;
    return null;
  },
  // before a full slide: what does the frame sum become?
  predict(ctx) {
    const [aName, kName] = ctx.params;
    const a = row(ctx.vars[aName]);
    const k = ctx.vars[kName];
    if (!a || !Number.isInteger(k) || !ctx.next) return null;
    const sName = SUM.find((n) => num(ctx.vars[n]) && num(ctx.next.vars[n]));
    if (!sName) return null;
    const [, r] = firstInt(ctx.next.vars, IDX);
    const s = ctx.vars[sName];
    const t = ctx.next.vars[sName];
    if (!Number.isInteger(r) || r < k || r >= a.length || t === s || t - s !== a[r] - a[r - k]) return null;
    return options(
      `The frame covers cells ${r - k}..${r - 1} with sum ${s}. It slides one cell right. What is the new sum?`,
      t,
      [s + a[r], s + a[r] - a[r - k + 1], s - a[r - k]],
      `${a[r]} (cell ${r}) enters on the right and ${a[r - k]} (cell ${r - k}) leaves on the left: ${s} + ${a[r]} − ${a[r - k]} = ${t}.`,
    );
  },
  bugs: [
    {
      label: 'Best starts at 0',
      find: 'let maxSum = windowSum;',
      replace: 'let maxSum = 0;',
      explain: 'When every frame has a negative sum, none beats 0, so the answer is 0 instead of the real best average.',
    },
    {
      label: 'Subtract the wrong cell: right - k + 1',
      find: 'nums[right - k]',
      replace: 'nums[right - k + 1]',
      explain: 'The cell removed is one that is still inside the frame, so the running sum drifts away from the real frame sum.',
    },
  ],
};
