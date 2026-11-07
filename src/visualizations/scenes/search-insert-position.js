// Search Insert Position: binary search for the first slot whose card is >= the new card. The half-open bracket
// [lo, hi) can reach n (insert after everything). Works with lo/hi, left/right, l/r, low/high and mid or m, and with
// the closed template (lo <= hi, hi = mid - 1) too: predictions read the move from the next step.
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
  id: 'search-insert-position',
  metaphor: 'Slot a new card into a sorted hand',
  caption: 'The cells are the sorted hand; the bracket is where the new card can still go. Each peek at the middle card rules out half of the slots, until one slot is left.',
  range: PAIRS,
  pointers: [...PAIRS.flat(), ...MID],
  compare: 'lo',
  narrate(ctx) {
    const [arrName, tName] = ctx.params;
    const a = row(ctx.vars[arrName]);
    const t = ctx.vars[tName];
    if (!a) return null;
    const [mName, m] = firstInt(ctx.vars, MID);
    if (mName && m !== ctx.prev[mName] && m >= 0 && m < a.length) {
      // no verdict: the prediction right after asks which way the bracket moves
      return `peek at slot ${m}: the card there is ${a[m]}, the new card is ${t}`;
    }
    const pair = pairOf(ctx.vars);
    if (!pair) return null;
    const [loName, hiName] = pair;
    const lo = ctx.vars[loName];
    const hi = ctx.vars[hiName];
    const [, pm] = firstInt(ctx.prev, MID);
    if (loName in ctx.prev && lo !== ctx.prev[loName] && Number.isInteger(pm) && pm >= 0 && pm < a.length) {
      return `${a[pm]} < ${t}: the new card goes after slot ${pm}, so ${loName} = ${lo}`;
    }
    if (hiName in ctx.prev && hi !== ctx.prev[hiName] && Number.isInteger(pm) && pm >= 0 && pm < a.length) {
      return a[pm] >= t && hi === pm
        ? `${a[pm]} ≥ ${t}: slot ${pm} could be the spot, keep it and look left (${hiName} = ${hi})`
        : `${a[pm]} > ${t}: the spot is left of slot ${pm} (${hiName} = ${hi})`;
    }
    if (/return/.test(ctx.src) && loName in ctx.prev) {
      return lo >= a.length ? `every card is smaller than ${t}: it goes at the end, slot ${lo}` : `the new card ${t} goes into slot ${lo}, just before ${a[lo]}`;
    }
    if (!(loName in ctx.prev)) return `the card can go into any of the ${a.length + 1} slots 0…${a.length} (after the last card too)`;
    return null;
  },
  // right after a peek: which way does the bracket move?
  predict(ctx) {
    const [arrName, tName] = ctx.params;
    const a = row(ctx.vars[arrName]);
    const [mName, m] = firstInt(ctx.vars, MID);
    const pair = pairOf(ctx.vars);
    if (!a || !mName || !pair || m === ctx.prev[mName] || !ctx.next || !(m >= 0 && m < a.length)) return null;
    const [loName, hiName] = pair;
    const nx = ctx.next.vars;
    const moved = nx[loName] > ctx.vars[loName] ? 'right' : nx[hiName] < ctx.vars[hiName] ? 'left' : ctx.next.ret ? 'found' : null;
    if (!moved) return null;
    const t = ctx.vars[tName];
    const opts = [`Look left: the spot is at slot ${m} or before (${hiName} moves down)`, `Look right: the card goes after slot ${m} (${loName} moves up)`, `Stop: slot ${m} is the answer`];
    return {
      question: `The card in slot ${m} is ${a[m]} and the new card is ${t}. What happens next?`,
      options: opts,
      answer: { left: 0, right: 1, found: 2 }[moved],
      explain: moved === 'found' ? `${a[m]} equals ${t}, so slot ${m} is returned.` : moved === 'right' ? `${a[m]} < ${t}: the new card must go after it, so slots up to ${m} are ruled out.` : `${a[m]} ≥ ${t}: the new card fits at slot ${m} or earlier, so everything right of it is ruled out.`,
    };
  },
  bugs: [
    {
      label: 'hi starts at n - 1: no slot after the last card',
      find: 'hi = nums.length;',
      replace: 'hi = nums.length - 1;',
      explain: 'The bracket never includes slot n, so a card bigger than every other card is put in slot n − 1 instead of at the end.',
    },
    {
      label: 'Compare with > instead of >=',
      find: 'nums[mid] >= target',
      replace: 'nums[mid] > target',
      explain: 'An equal card is treated as too small, so the search walks past it and returns the slot after the target instead of its own index.',
    },
  ],
};
