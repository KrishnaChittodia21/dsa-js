// Koko Eating Bananas: binary search on the eating speed. lo / hi are speeds, not indexes into piles, so no
// pointers are drawn on the piles. Works with lo/hi, left/right, l/r, low/high and mid / k / speed.
import { firstInt, options } from './util.js';

const PAIRS = [
  ['lo', 'hi'],
  ['left', 'right'],
  ['l', 'r'],
  ['low', 'high'],
];
const SPEED = ['mid', 'k', 'speed', 'm'];
const HOURS = ['hours', 'hrs', 'total', 'time', 'spent', 'need', 'needed'];
const PILE = ['p', 'pile', 'x', 'b'];
const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));

export default {
  id: 'koko-eating-bananas',
  metaphor: 'Piles of bananas, a ticking clock',
  caption: 'Each cell is a pile of bananas. The search tries an eating speed, adds up the hours each pile takes, and keeps the slower half of the speeds when the guards would not catch her.',
  pointers: [],
  compare: 'lo',
  narrate(ctx) {
    const [, hName] = ctx.params;
    const h = ctx.vars[hName];
    const [hrName, hours] = firstInt(ctx.vars, HOURS);
    const [, pile] = firstInt(ctx.vars, PILE);
    const [, k] = firstInt(ctx.vars, ['k', 'speed', 'mid']);
    // one pile eaten at speed k: ceil(pile / k) hours
    if (hrName && hrName !== hName && Number.isInteger(ctx.prev[hrName]) && hours > ctx.prev[hrName] && Number.isInteger(pile) && k > 0) {
      return `a pile of ${pile} at ${k} per hour takes ${Math.ceil(pile / k)} h (running total ${hours} h of ${h})`;
    }
    const pair = pairOf(ctx.vars);
    if (!pair) return null;
    const [loName, hiName] = pair;
    const lo = ctx.vars[loName];
    const hi = ctx.vars[hiName];
    const [mName, mid] = firstInt(ctx.vars, SPEED);
    if (Number.isInteger(ctx.prev[loName]) && lo > ctx.prev[loName] && ctx.prev[hiName] === hi) {
      return `too slow: she would miss the guards' ${h} h, so speeds up to ${lo - 1} are out (try ${lo}…${hi})`;
    }
    if (Number.isInteger(ctx.prev[hiName]) && hi < ctx.prev[hiName] && ctx.prev[loName] === lo && ctx.prev[hiName] !== 0) {
      return `speed ${hi} is fast enough: keep it as the best so far and look for slower ones (${lo}…${hi})`;
    }
    if (mName && mid !== firstInt(ctx.prev, SPEED)[1] && lo <= hi) return `try speed ${mid} bananas/hour: the answer is somewhere in ${lo}…${hi}`;
    if (lo === hi && ctx.prev[loName] !== undefined && /return/.test(ctx.src)) return `the bracket closed at ${lo}: the slowest speed that still finishes in ${h} h`;
    return null;
  },
  // just before the bracket moves: was that speed fast enough?
  predict(ctx) {
    if (!ctx.next) return null;
    const pair = pairOf(ctx.vars);
    const [mName, mid] = firstInt(ctx.vars, SPEED);
    if (!pair || !mName) return null;
    const [loName, hiName] = pair;
    const nx = ctx.next.vars;
    if (!Number.isInteger(nx[loName]) || !Number.isInteger(nx[hiName])) return null;
    const up = nx[loName] > ctx.vars[loName] && nx[hiName] === ctx.vars[hiName];
    const down = nx[hiName] < ctx.vars[hiName] && nx[loName] === ctx.vars[loName];
    if (up === down) return null;
    const opts = [`Too slow: look at faster speeds (${loName} moves up)`, `Fast enough: look at slower speeds (${hiName} moves down)`];
    return {
      question: `Koko tried speed ${mid} with ${ctx.vars[ctx.params[1]]} hours before the guards return. Which half of the speeds is kept?`,
      options: opts,
      answer: up ? 0 : 1,
      explain: up ? `At ${mid} per hour the piles take more than ${ctx.vars[ctx.params[1]]} hours, so every speed ≤ ${mid} is too slow.` : `At ${mid} per hour she finishes in time; a slower speed might too, so ${mid} becomes the upper end.`,
    };
  },
  bugs: [
    {
      label: 'Round the hours down',
      find: 'Math.ceil(p / k)',
      replace: 'Math.floor(p / k)',
      explain: 'A pile of 7 at speed 2 takes 4 hours, not 3: the leftover banana still costs a whole hour. Rounding down makes slow speeds look fast enough.',
    },
    {
      label: 'Drop the speed that worked',
      find: 'hi = mid;',
      replace: 'hi = mid - 1;',
      explain: 'When a speed is fast enough it may be the answer, but hi = mid - 1 throws it away, so the search can end one speed too slow.',
    },
  ],
};
