// Maximum Score of a Good Subarray (two pointers growing out from k). The window always holds k; each step it
// grows by one toward the taller neighbour, so its floor (the minimum) drops as slowly as possible. Score = floor ×
// width. Works with i/j, l/r, left/right, lo/hi; the floor is recomputed from the array, so any min name works.
import { row } from './util.js';

const PAIRS = [
  ['i', 'j'],
  ['l', 'r'],
  ['left', 'right'],
  ['lo', 'hi'],
  ['start', 'end'],
];
const BEST = ['best', 'ans', 'res', 'result', 'max', 'maxScore', 'score', 'answer'];
const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
const floorOf = (a, i, j) => Math.min(...a.slice(i, j + 1));

function stateOf(ctx) {
  const [aName, kName] = ctx.params;
  const a = row(ctx.vars[aName]);
  const k = ctx.vars[kName];
  const pair = pairOf(ctx.vars);
  if (!a || !pair || !Number.isInteger(k)) return null;
  const [iName, jName] = pair;
  const i = ctx.vars[iName];
  const j = ctx.vars[jName];
  if (!(i >= 0 && i <= k && k <= j && j < a.length)) return null;
  return { a, k, i, j, iName, jName };
}

export default {
  id: 'maximum-score-of-a-good-subarray',
  metaphor: 'A window around k, floor sinking slowly',
  caption: 'The bracket must always cover k. It grows one step at a time toward the taller neighbour, so its floor (the smallest number inside) sinks as slowly as possible. Score = floor × width.',
  range: PAIRS,
  pointers: [...PAIRS.flat(), 'k'],
  compare: 'best',
  narrate(ctx) {
    const st = stateOf(ctx);
    if (!st) return null;
    const { a, i, j, iName, jName } = st;
    const pi = ctx.prev[iName];
    const pj = ctx.prev[jName];
    const f = floorOf(a, i, j);
    const w = j - i + 1;
    if (Number.isInteger(pi) && Number.isInteger(pj)) {
      if (j === pj + 1 && i === pi) {
        const why = pi === 0 ? 'the left end is already at the wall' : `${a[j]} is taller than ${a[pi - 1]} on the left`;
        return `grow right to take ${a[j]}: ${why}${f < floorOf(a, pi, pj) ? ` · the floor sinks to ${f}` : ''}`;
      }
      if (i === pi - 1 && j === pj) {
        const why = pj === a.length - 1 ? 'the right end is already at the wall' : `${a[i]} is not shorter than ${a[pj + 1]} on the right`;
        return `grow left to take ${a[i]}: ${why}${f < floorOf(a, pi, pj) ? ` · the floor sinks to ${f}` : ''}`;
      }
    }
    const bName = BEST.find((n) => Number.isFinite(ctx.vars[n]));
    if (!bName || !Number.isFinite(ctx.prev[bName])) return null;
    const best = ctx.vars[bName];
    const msg = `window ${i}..${j}: floor ${f} × ${w} wide = ${f * w}`;
    if (best !== ctx.prev[bName] && best === f * w) return `${msg}, a new best`;
    const line = ctx.lines[ctx.line - 1] || '';
    if (best === ctx.prev[bName] && new RegExp(`\\b${bName}\\b`).test(line) && /Math\.max|>/.test(line)) return `${msg}, the best stays ${best}`;
    return null;
  },
  // both sides open: which way does the window grow?
  predict(ctx) {
    const st = stateOf(ctx);
    if (!st || !ctx.next) return null;
    const { a, i, j, iName, jName } = st;
    if (i === 0 || j === a.length - 1 || a[i - 1] === a[j + 1] || ctx.prev[iName] !== i || ctx.prev[jName] !== j) return null;
    const ni = ctx.next.vars[iName];
    const nj = ctx.next.vars[jName];
    const side = ni === i - 1 && nj === j ? 0 : nj === j + 1 && ni === i ? 1 : null;
    if (side === null) return null;
    const right = a[j + 1] > a[i - 1];
    if ((side === 1) !== right) return null; // the code chose the shorter side: not a fair question
    return {
      question: `The window is ${i}..${j}. Left neighbour ${a[i - 1]}, right neighbour ${a[j + 1]}. Which way does it grow?`,
      options: [`Left, to take ${a[i - 1]}`, `Right, to take ${a[j + 1]}`],
      answer: side,
      explain: `${Math.max(a[i - 1], a[j + 1])} is the taller neighbour: taking it lowers the floor the least, so later, wider windows keep a higher floor.`,
    };
  },
  bugs: [
    {
      label: 'Grow toward the shorter neighbour',
      find: 'nums[j + 1] > nums[i - 1]',
      replace: 'nums[j + 1] < nums[i - 1]',
      explain: 'Taking the shorter neighbour sinks the floor early, so the wide windows that should score high all have a low floor.',
    },
    {
      label: 'Width as j - i (one short)',
      find: 'curMin * (j - i + 1)',
      replace: 'curMin * (j - i)',
      explain: 'The window i..j holds j − i + 1 numbers; dropping the + 1 makes every score one floor too small.',
    },
  ],
};
