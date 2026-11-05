// Maximum Subarray (Kadane). A streak of gains: at each number, extend the streak that ends here or drop a streak
// that only drags you down and start fresh; best remembers the best streak seen anywhere. Works with common names
// for the running sum (cur, sum, maxEndingHere…) and the record (best, max, res…), by index or for-of element.
import { firstInt } from './util.js';

const RUN = ['cur', 'curr', 'current', 'curSum', 'currSum', 'currentSum', 'sum', 'running', 'runningSum', 'here', 'endingHere', 'maxEndingHere', 'acc', 'streak'];
const BEST = ['best', 'max', 'maxSum', 'res', 'result', 'ans', 'answer', 'maxSoFar', 'bestSum', 'globalMax', 'overall', 'record'];
const IDX = ['i', 'j', 'k', 'idx', 'index', 'end', 'r'];
const ELEM = ['x', 'num', 'val', 'v', 'value', 'el', 'e', 'a'];
const fin = (v) => typeof v === 'number' && Number.isFinite(v);
const plus = (a, b) => (b < 0 ? `${a} − ${-b}` : `${a} + ${b}`);

/** the number being looked at in this snapshot: nums[i] by index, else a for-of element */
function elemOf(vars, arr) {
  const [iName, i] = firstInt(vars, IDX);
  if (iName && Array.isArray(arr) && i >= 0 && i < arr.length && fin(arr[i])) return [arr[i], `${iName} = ${i}`];
  const e = ELEM.find((k) => fin(vars[k]));
  return e ? [vars[e], null] : [undefined, null];
}
const numName = (vars, names) => names.find((k) => fin(vars[k]));

export default {
  id: 'maximum-subarray',
  metaphor: 'A streak of gains, or start fresh',
  caption: 'cur is the best streak that ends on the current number: extend it, or drop it when it has gone negative and start fresh. best remembers the best streak seen anywhere.',
  compare: 'best',
  narrate(ctx) {
    const arr = ctx.vars[ctx.params[0]];
    const run = numName(ctx.vars, RUN);
    const best = numName(ctx.vars, BEST);
    const [v, at] = elemOf(ctx.vars, arr);
    if (run && ctx.vars[run] !== ctx.prev[run]) {
      const c = ctx.vars[run];
      const was = ctx.prev[run];
      if (!fin(was)) return c === 0 ? `the streak starts empty: ${run} = 0` : `the streak starts with the first number: ${run} = ${c}`;
      if (was === 0 && fin(v) && c === v) return `${at ? `${at}: ` : ''}a new streak starts at ${v}`;
      if (fin(v) && c === was + v && c !== v) return `${at ? `${at}: ` : ''}extend the streak: ${plus(was, v)} = ${c}`;
      if (fin(v) && c === v) return `${at ? `${at}: ` : ''}the old streak (${was}) only drags ${v} down: start fresh at ${v}`;
      if (c === 0 && was < 0) return `the streak fell to ${was}: drop it and start again from 0`;
      return null;
    }
    if (best && ctx.vars[best] !== ctx.prev[best]) {
      const b = ctx.vars[best];
      if (!fin(ctx.prev[best])) return `${best} = ${b}: the record so far is the first streak`;
      return `new record: ${best} = ${b} (was ${ctx.prev[best]})`;
    }
    const line = ctx.lines[ctx.line - 1] || '';
    if (best && run && new RegExp(`\\b${best}\\s*=`).test(line)) return `${run} = ${ctx.vars[run]} does not beat the record: ${best} stays ${ctx.vars[best]}`;
    return null;
  },
  // before the running sum changes: extend the streak or start fresh?
  predict(ctx) {
    if (!ctx.next) return null;
    const run = numName(ctx.vars, RUN);
    if (!run || run !== numName(ctx.next.vars, RUN)) return null;
    const c = ctx.vars[run];
    const after = ctx.next.vars[run];
    if (after === c) return null;
    const [v] = elemOf(ctx.next.vars, ctx.next.vars[ctx.params[0]]);
    if (!fin(v) || c + v === v) return null; // c = 0: extending and restarting give the same sum
    const extend = `Extend: ${plus(c, v)} = ${c + v}`;
    const fresh = `Start fresh at ${v}`;
    const right = after === c + v ? extend : after === v ? fresh : null;
    if (!right) return null;
    return {
      question: `The streak ending here is ${run} = ${c}; the next number is ${v}. What does the streak become?`,
      options: [extend, fresh],
      answer: right === extend ? 0 : 1,
      explain: right === extend ? `${c} is not negative, so carrying it along only helps ${v}: ${c + v} ≥ ${v}.` : `${c} is negative, so carrying it would only make ${v} smaller: ${v} alone is better than ${c + v}.`,
    };
  },
  bugs: [
    {
      label: 'best starts at 0',
      find: 'let best = nums[0];',
      replace: 'let best = 0;',
      explain: 'When every number is negative no streak ever beats 0, so [-3, -1, -2] returns 0 instead of -1: an empty streak is not allowed.',
    },
    {
      label: 'Never start fresh',
      find: 'Math.max(nums[i], cur + nums[i])',
      replace: 'cur + nums[i]',
      explain: 'The streak always carries its past, even a deeply negative one, so a good run after a big loss is never counted on its own.',
    },
  ],
};
