// Find Peak Element: climbing hills in the fog. You can only see the step next to you, but walking uphill always ends
// on a top (the edges of the map are -∞). Works with lo/hi, left/right, l/r, low/high, start/end and mid / m.
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
  id: 'find-peak-element',
  metaphor: 'Climbing hills in the fog',
  caption: 'Each cell is the height of the ground. Standing in the middle you see only the next step; walk towards the higher one and a hilltop must lie that way, because the land falls off at both edges.',
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
    if (mName && m !== ctx.prev[mName] && m >= 0 && m < a.length) {
      // no verdict: the prediction right after asks which way is uphill
      return `stand at index ${m} (height ${a[m]}) and peer at the next step`;
    }
    if (!(loName in ctx.prev) || !(hiName in ctx.prev) || lo < 0 || lo >= a.length) return null;
    if (lo === hi && (lo !== ctx.prev[loName] || hi !== ctx.prev[hiName])) return `the search closed on index ${lo}: height ${a[lo]} is a hilltop`;
    if (lo !== ctx.prev[loName]) return `uphill to the right: a top must lie in ${lo}…${hi}`;
    if (hi !== ctx.prev[hiName]) return `downhill to the right: index ${hi} or something left of it is a top (${lo}…${hi})`;
    return null;
  },
  // right after a new middle: which way is uphill?
  predict(ctx) {
    const a = row(ctx.vars[ctx.params[0]]);
    const [mName, m] = firstInt(ctx.vars, MID);
    const pair = pairOf(ctx.vars);
    if (!a || !mName || !pair || m === ctx.prev[mName] || !ctx.next || m + 1 >= a.length) return null;
    const [loName, hiName] = pair;
    const nx = ctx.next.vars;
    const lo = ctx.vars[loName];
    const hi = ctx.vars[hiName];
    if (!Number.isInteger(nx[loName]) || !Number.isInteger(nx[hiName])) return null;
    const up = nx[loName] > lo && nx[hiName] === hi;
    const down = nx[hiName] < hi && nx[loName] === lo;
    if (up === down) return null;
    return {
      question: `At index ${m} the ground is ${a[m]}; the next step is ${a[m + 1]}. Where must a hilltop be?`,
      options: [`Right of ${m}: ${loName} moves up`, `At ${m} or left of it: ${hiName} moves down`],
      answer: up ? 0 : 1,
      explain: up ? `${a[m + 1]} > ${a[m]}: the ground rises to the right, and it must come down by the edge, so a top lies to the right.` : `${a[m + 1]} < ${a[m]}: the ground falls to the right, so index ${m} or something to its left is a top.`,
    };
  },
  bugs: [
    {
      label: 'hi = mid - 1: step off the top',
      find: 'else hi = mid;',
      replace: 'else hi = mid - 1;',
      explain: 'When the next step goes down, the middle may itself be the hilltop. Moving hi past it can leave the search on a slope that is not a top.',
    },
  ],
};
