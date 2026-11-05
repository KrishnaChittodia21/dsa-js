// Gold scene: Binary Search. The bracket is the part of the array that can still hold the target; every guess at
// the middle drops half of it. Works with lo/hi, left/right, l/r, low/high, start/end and mid or m.
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
  id: 'binary-search',
  metaphor: 'Guess the page in a sorted book',
  caption: 'The bracket is the part of the array that can still hold the target. Each guess at the middle throws half of it away, so 10,000 items need only about 14 guesses.',
  range: PAIRS,
  pointers: [...PAIRS.flat(), ...MID],
  compare: 'mid',
  narrate(ctx) {
    const [arrName, tName] = ctx.params;
    const a = row(ctx.vars[arrName]);
    const t = ctx.vars[tName];
    const [mName, m] = firstInt(ctx.vars, MID);
    if (a && mName && m !== ctx.prev[mName] && m >= 0 && m < a.length) {
      const verdict = a[m] === t ? 'found it' : a[m] < t ? 'too small: the target can only be to the right' : 'too big: the target can only be to the left';
      return `guess the middle: ${arrName}[${m}] = ${a[m]} vs target ${t} → ${verdict}`;
    }
    const pair = pairOf(ctx.vars);
    if (!pair) return null;
    const [loName, hiName] = pair;
    const lo = ctx.vars[loName];
    const hi = ctx.vars[hiName];
    const left = Math.max(0, hi - lo + 1);
    if (lo > hi) return `${loName} = ${lo} passed ${hiName} = ${hi}: the bracket is empty, so the target is not in the array`;
    if (lo !== ctx.prev[loName] && loName in ctx.prev) return `${loName} = ${lo}: everything left of it is too small and is dropped (${left} left to search)`;
    if (hi !== ctx.prev[hiName] && hiName in ctx.prev) return `${hiName} = ${hi}: everything right of it is too big and is dropped (${left} left to search)`;
    return null;
  },
  // right after a guess: which half goes?
  predict(ctx) {
    const [arrName, tName] = ctx.params;
    const a = row(ctx.vars[arrName]);
    const [mName, m] = firstInt(ctx.vars, MID);
    const pair = pairOf(ctx.vars);
    if (!a || !mName || !pair || m === ctx.prev[mName] || !ctx.next) return null;
    const [loName, hiName] = pair;
    const nx = ctx.next.vars;
    const isReturn = /^\s*(if\s*\(.*\)\s*)?return\b/.test(ctx.lines[ctx.next.line - 1] || '');
    const moved = nx[loName] !== ctx.vars[loName] ? 'left' : nx[hiName] !== ctx.vars[hiName] ? 'right' : isReturn ? 'found' : null;
    if (!moved) return null;
    const opts = [`Drop the left half (${loName} moves up)`, `Drop the right half (${hiName} moves down)`, `Neither: ${arrName}[${m}] is the target`];
    return {
      question: `${arrName}[${m}] = ${a[m]} and the target is ${ctx.vars[tName]}. What happens next?`,
      options: opts,
      answer: { left: 0, right: 1, found: 2 }[moved],
      explain: moved === 'found' ? 'The middle value equals the target, so its index is returned.' : `${a[m]} is ${moved === 'left' ? 'smaller' : 'bigger'} than the target, and the array is sorted, so the whole ${moved} side can be skipped.`,
    };
  },
  bugs: [
    {
      label: 'while (lo < hi): last item never checked',
      find: 'lo <= hi',
      replace: 'lo < hi',
      explain: 'When one item is left, lo === hi and the loop stops before comparing it, so a target sitting there is reported missing.',
    },
  ],
};
