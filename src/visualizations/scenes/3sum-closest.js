// 3Sum Closest (sort + fix one + two pointers). Fix the first number, pinch the rest of the sorted row toward the
// target: below it the left pointer steps up, above it the right steps down; keep the sum that came closest.
// Works with i + l/r, left/right, lo/hi or j/k, a sorted copy under any name, and best/closest/ans.
import { row, sorted } from './util.js';

const PAIRS = [
  ['l', 'r'],
  ['left', 'right'],
  ['lo', 'hi'],
  ['j', 'k'],
  ['start', 'end'],
];
const FIX = ['i', 'k', 'first', 'idx', 'x', 'p'];
const SUM = ['sum', 'total', 's', 'cur', 'curr', 'current'];
const BEST = ['best', 'closest', 'ans', 'answer', 'res', 'result', 'closestSum', 'bestSum', 'nearest'];

const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
const fixOf = (vars, pair) => FIX.find((n) => !pair?.includes(n) && Number.isInteger(vars[n]));
// the sorted row: the input once sorted, or a sorted copy under any name
function rowOf(vars, pName) {
  const p = row(vars[pName]);
  if (!p) return null;
  if (sorted(p)) return p;
  return Object.values(vars).find((v) => row(v) && v.length === p.length && sorted(v)) || null;
}

function stateOf(ctx) {
  const [pName, tName] = ctx.params;
  const a = rowOf(ctx.vars, pName);
  const t = ctx.vars[tName];
  const pair = pairOf(ctx.vars);
  const fName = fixOf(ctx.vars, pair);
  if (!a || !fName || !Number.isFinite(t)) return null;
  const i = ctx.vars[fName];
  if (!(i >= 0 && i < a.length)) return null;
  return { a, t, i, fName, pair };
}

export default {
  id: '3sum-closest',
  metaphor: 'Pinch three numbers toward a target',
  caption: 'The row is sorted. One number is fixed; the bracket over the rest pinches in: below the target the left end steps up, above it the right end steps down. The closest sum seen is kept.',
  range: PAIRS,
  pointers: [...PAIRS.flat(), ...FIX],
  compare: 'best',
  narrate(ctx) {
    const st = stateOf(ctx);
    if (!st) return null;
    const { a, t, i, fName, pair } = st;
    const bName = BEST.find((n) => Number.isFinite(ctx.vars[n]));
    const best = bName && ctx.vars[bName];
    if (bName && Number.isFinite(ctx.prev[bName]) && best !== ctx.prev[bName]) {
      // an exact hit is the next question ("stop?"), so do not say 0 away
      if (best === t) return `${best} becomes the closest sum so far (${ctx.prev[bName]} was ${Math.abs(ctx.prev[bName] - t)} away)`;
      return `${best} is ${Math.abs(best - t)} away from ${t}: the closest sum so far (${ctx.prev[bName]} was ${Math.abs(ctx.prev[bName] - t)} away)`;
    }
    if (i !== ctx.prev[fName]) return `fix ${a[i]} (index ${i}): pinch the rest for the sum closest to ${t}`;
    if (!pair) return null;
    const [lName, rName] = pair;
    const l = ctx.vars[lName];
    const r = ctx.vars[rName];
    const pl = ctx.prev[lName];
    const pr = ctx.prev[rName];
    const met = l >= r ? ` · the pointers met: done with ${a[i]}` : '';
    if (l === i + 1 && r === a.length - 1 && (pl !== l || pr !== r)) return `pinch the rest: ${a[l]} on the left, ${a[r]} on the right`;
    const sName = SUM.find((n) => Number.isFinite(ctx.vars[n]));
    if (sName && ctx.vars[sName] === t && /\breturn\b/.test(ctx.lines[ctx.line - 1] || '')) return `${t} is exactly the target: no sum can be closer, so stop here`;
    // why a pointer moved: the stored sum it was moved for
    if (sName && Number.isInteger(pl) && Number.isInteger(pr)) {
      const s = ctx.vars[sName];
      if (l === pl + 1 && r === pr && s < t) return `${s} is below ${t}: the left pointer steps up to a bigger number${met || ` (${a[l]})`}`;
      if (r === pr - 1 && l === pl && s > t) return `${s} is above ${t}: the right pointer steps down to a smaller number${met || ` (${a[r]})`}`;
    }
    // the step that adds the three numbers up (no verdict: that is the question)
    if (sName && l < r && a[l] !== undefined && a[r] !== undefined && new RegExp(`\\b${sName}\\s*=[^=]`).test(ctx.lines[ctx.line - 1] || '')) {
      const s = a[i] + a[l] + a[r];
      // no verdict: the question right after may be "is this the answer?"
      return `${a[i]} + ${a[l]} + ${a[r]} = ${s}, the target is ${t}${Number.isFinite(best) ? ` (closest so far ${best})` : ''}`;
    }
    return null;
  },
  // the first sum for each fixed number: which way does the pinch go (or is it a hit)?
  predict(ctx) {
    const st = stateOf(ctx);
    if (!st || !st.pair || !ctx.next) return null;
    const { a, t, i, fName, pair } = st;
    const [lName, rName] = pair;
    const l = ctx.vars[lName];
    const r = ctx.vars[rName];
    if (l >= r || a[l] === undefined || a[r] === undefined || ctx.prev[lName] !== l || ctx.prev[rName] !== r || ctx.prev[fName] !== i) return null;
    const nx = ctx.next.vars;
    const s = a[i] + a[l] + a[r];
    const isReturn = /\breturn\b/.test(ctx.lines[ctx.next.line - 1] || '');
    const what = nx[lName] === l + 1 && nx[rName] === r ? 0 : nx[rName] === r - 1 && nx[lName] === l ? 1 : isReturn && s === t ? 2 : null;
    if (what === null || (what === 0 && s >= t) || (what === 1 && s <= t)) return null;
    if (what !== 2 && (l !== i + 1 || r !== a.length - 1)) return null; // one move question per fixed number
    return {
      question: `${a[i]} + ${a[l]} + ${a[r]} = ${s} and the target is ${t}. What happens next?`,
      options: [`The left pointer steps up (${a[l]} → bigger)`, `The right pointer steps down (${a[r]} → smaller)`, `Stop: ${s} is the answer`],
      answer: what,
      explain: what === 2 ? `${s} is exactly ${t}: no sum can be closer, so it is returned at once.` : what === 0 ? `${s} is below ${t} and the row is sorted: only a bigger left number can bring the sum up.` : `${s} is above ${t}: only a smaller right number can bring the sum down.`,
    };
  },
  bugs: [
    {
      label: 'Start the closest sum at 0',
      find: 'let best = a[0] + a[1] + a[2];',
      replace: 'let best = 0;',
      explain: '0 may not be a sum of any three numbers: with [2, 2, 2, 5] and target 0 nothing beats the fake 0, so 0 is returned instead of 6.',
    },
    {
      label: 'Default sort(): numbers sorted as text',
      find: '.sort((x, y) => x - y)',
      replace: '.sort()',
      explain: 'Without a comparator -40 sorts before -5 and 30 before 8, so the row is not really sorted and the pinch moves the wrong way.',
    },
  ],
};
