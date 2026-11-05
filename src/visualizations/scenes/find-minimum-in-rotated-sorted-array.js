// Find Minimum in Rotated Sorted Array: a sorted staircase was cut and its two pieces swapped, so somewhere the steps
// drop. Comparing the middle step with the right end tells which side the drop is on. Works with lo/hi, left/right,
// l/r, low/high, start/end and mid / m.
import { firstInt, row } from './util.js';

const PAIRS = [
  ['lo', 'hi'],
  ['left', 'right'],
  ['l', 'r'],
  ['low', 'high'],
  ['start', 'end'],
];
const MID = ['mid', 'm', 'middle'];
const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));

export default {
  id: 'find-minimum-in-rotated-sorted-array',
  metaphor: 'A staircase cut and turned around',
  caption: 'The array is a rising staircase whose end was moved to the front, so the steps drop once. The bracket holds the drop: compare the middle step with the right end to learn which side it is on.',
  range: PAIRS,
  pointers: [...PAIRS.flat(), ...MID],
  compare: 'mid',
  narrate(ctx) {
    const a = row(ctx.vars[ctx.params[0]]);
    const pair = pairOf(ctx.vars);
    if (!a || !pair) return null;
    const [loName, hiName] = pair;
    const lo = ctx.vars[loName];
    const hi = ctx.vars[hiName];
    const [mName, m] = firstInt(ctx.vars, MID);
    if (mName && m !== ctx.prev[mName] && m >= 0 && m < a.length && hi < a.length) {
      // no verdict: the prediction right after asks which side the drop is on
      return `look at the middle step ${a[m]} (index ${m}) and the right end ${a[hi]} (index ${hi})`;
    }
    if (!(loName in ctx.prev) || !(hiName in ctx.prev)) return null;
    if (lo !== ctx.prev[loName]) {
      return lo === hi ? `${loName} = ${hiName} = ${lo}: one step left, ${a[lo]} is the bottom of the drop` : `the drop is right of the middle: steps up to index ${lo - 1} are in the high run (search ${lo}…${hi})`;
    }
    if (hi !== ctx.prev[hiName]) {
      return lo === hi ? `${loName} = ${hiName} = ${lo}: one step left, ${a[lo]} is the bottom of the drop` : `index ${hi}…end rises smoothly: the minimum is at ${hi} or to its left (search ${lo}…${hi})`;
    }
    return null;
  },
  // right after a new middle: which side of the bracket goes?
  predict(ctx) {
    const a = row(ctx.vars[ctx.params[0]]);
    const [mName, m] = firstInt(ctx.vars, MID);
    const pair = pairOf(ctx.vars);
    if (!a || !mName || !pair || m === ctx.prev[mName] || !ctx.next) return null;
    const [loName, hiName] = pair;
    const nx = ctx.next.vars;
    const lo = ctx.vars[loName];
    const hi = ctx.vars[hiName];
    if (!Number.isInteger(nx[loName]) || !Number.isInteger(nx[hiName]) || hi >= a.length) return null;
    const up = nx[loName] > lo && nx[hiName] === hi;
    const down = nx[hiName] < hi && nx[loName] === lo;
    if (up === down) return null;
    return {
      question: `The middle step is ${a[m]} (index ${m}) and the right end is ${a[hi]}. Where is the drop?`,
      options: [`Right of the middle: ${loName} moves up`, `At the middle or left of it: ${hiName} moves down`],
      answer: up ? 0 : 1,
      explain: up ? `${a[m]} > ${a[hi]}: the steps fall somewhere between the middle and the right end, so the minimum is right of index ${m}.` : `${a[m]} < ${a[hi]}: index ${m}…${hi} rises with no drop, so the minimum is ${a[m]} itself or further left.`,
    };
  },
  bugs: [
    {
      label: 'Compare with the left end',
      find: 'nums[mid] > nums[hi]',
      replace: 'nums[mid] > nums[lo]',
      explain: 'On a staircase that was not turned at all, the middle is always above the left end, so the search runs right and misses the minimum at index 0.',
    },
    {
      label: 'hi = mid - 1: drop the middle',
      find: 'else hi = mid;',
      replace: 'else hi = mid - 1;',
      explain: 'When the middle is lower than the right end, the middle itself may be the minimum. Moving hi past it can throw the answer away.',
    },
  ],
};
