// 3Sum (sort + fix one + two pointers). Fix the first number, then pinch the rest of the sorted row from both ends:
// too small → the left pointer steps up, too big → the right steps down, zero → a triplet. Works with i + l/r,
// left/right, lo/hi or j/k, a sorted copy under any name, and sum/total/s.
import { row, sorted } from './util.js';

const PAIRS = [
  ['l', 'r'],
  ['left', 'right'],
  ['lo', 'hi'],
  ['j', 'k'],
  ['start', 'end'],
];
const FIX = ['i', 'k', 'first', 'idx', 'x', 'p'];
const SUM = ['sum', 'total', 's', 'cur', 'curr', 'current', 'threeSum'];
const OUT = ['result', 'res', 'ans', 'answer', 'out', 'output', 'triplets', 'triples', 'list'];

const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
const fixOf = (vars, pair) => FIX.find((n) => !pair?.includes(n) && Number.isInteger(vars[n]));
// the sorted row: the input once sorted, or a sorted copy under any name
function rowOf(vars, pName) {
  const p = row(vars[pName]);
  if (!p) return null;
  if (sorted(p)) return p;
  const copy = Object.values(vars).find((v) => row(v) && v.length === p.length && sorted(v));
  return copy || null;
}
const outOf = (vars) => OUT.find((n) => Array.isArray(vars[n]) && vars[n].every((t) => row(t)));
const show = (t) => `[${t.join(', ')}]`;

/** the state every note and question needs, or null */
function stateOf(ctx) {
  const a = rowOf(ctx.vars, ctx.params[0]);
  const pair = pairOf(ctx.vars);
  const fName = fixOf(ctx.vars, pair);
  if (!a || !fName) return null;
  const i = ctx.vars[fName];
  if (!(i >= 0 && i < a.length)) return null;
  return { a, i, fName, pair };
}

export default {
  id: '3sum',
  metaphor: 'Fix one, pinch the other two',
  caption: 'The row is sorted. One number is fixed; the bracket over the rest pinches in: a sum below 0 needs a bigger left number, above 0 a smaller right one. A zero sum is a triplet.',
  range: PAIRS,
  pointers: [...PAIRS.flat(), ...FIX],
  compare: 'result',
  narrate(ctx) {
    const st = stateOf(ctx);
    if (!st) return null;
    const { a, i, fName, pair } = st;
    const oName = outOf(ctx.vars);
    const out = oName && ctx.vars[oName];
    const was = oName && ctx.prev[oName];
    if (out && Array.isArray(was) && out.length === was.length + 1) {
      const t = out[out.length - 1];
      return `found ${show(t)}: ${t.join(' + ')} = 0 · ${out.length} triplet${out.length > 1 ? 's' : ''} so far`;
    }
    if (i !== ctx.prev[fName]) {
      if (i > 0 && a[i] === a[i - 1]) return `${a[i]} again as the first number: its triplets were already found, skip it`;
      if (a[i] > 0) return `the first number ${a[i]} is positive: three numbers ≥ ${a[i]} cannot add up to 0, stop`;
      return `fix ${a[i]} (index ${i}): find two numbers to its right that add up to ${-a[i]}`;
    }
    if (!pair) return null;
    const [lName, rName] = pair;
    const l = ctx.vars[lName];
    const r = ctx.vars[rName];
    const pl = ctx.prev[lName];
    const pr = ctx.prev[rName];
    if (a[l] === undefined && l <= r) return null;
    const met = l >= r ? ` · the pointers met: done with ${a[i]}` : '';
    if (l === i + 1 && r === a.length - 1 && (pl !== l || pr !== r)) return `pinch the rest: ${a[l]} on the left, ${a[r]} on the right`;
    // why a pointer moved: the sum it was moved for (a stored sum stays at 0 while stepping past a triplet)
    const sName = SUM.find((n) => Number.isFinite(ctx.vars[n]));
    const ps = sName ? ctx.vars[sName] : null;
    if (ps !== null && Number.isInteger(pl) && Number.isInteger(pr) && a[pl] !== undefined && a[pr] !== undefined) {
      if (l === pl + 1 && r === pr) {
        if (ps < 0) return `${ps} is too small: the left pointer steps up to a bigger number${met || ` (${a[l]})`}`;
        if (ps === 0) return `the left pointer moves on${a[l] === a[pl] ? `: ${a[l]} again, a duplicate, keep going` : ` to ${a[l]}`}${met}`;
      }
      if (r === pr - 1 && l === pl) {
        if (ps > 0) return `${ps} is too big: the right pointer steps down to a smaller number${met || ` (${a[r]})`}`;
        if (ps === 0) return `the right pointer moves on${a[r] === a[pr] ? `: ${a[r]} again, a duplicate, keep going` : ` to ${a[r]}`}${met}`;
      }
    }
    // the step that adds the three numbers up (no verdict: that is the question)
    if (sName && l < r && new RegExp(`\\b${sName}\\s*=[^=]`).test(ctx.lines[ctx.line - 1] || '')) return `${a[i]} + ${a[l]} + ${a[r]} = ${a[i] + a[l] + a[r]} (we want 0)`;
    return null;
  },
  // the first sum for each fixed number: which way does the pinch go?
  predict(ctx) {
    const st = stateOf(ctx);
    if (!st || !st.pair || !ctx.next) return null;
    const { a, i, fName, pair } = st;
    const [lName, rName] = pair;
    const l = ctx.vars[lName];
    const r = ctx.vars[rName];
    if (l !== i + 1 || r !== a.length - 1 || l >= r || ctx.prev[lName] !== l || ctx.prev[rName] !== r || ctx.prev[fName] !== i) return null;
    const nx = ctx.next.vars;
    const oName = outOf(ctx.vars);
    const grew = oName && Array.isArray(nx[oName]) && nx[oName].length === ctx.vars[oName].length + 1;
    const s = a[i] + a[l] + a[r];
    const what = grew ? 2 : nx[lName] === l + 1 && nx[rName] === r ? 0 : nx[rName] === r - 1 && nx[lName] === l ? 1 : null;
    if (what === null || (what === 0 && s >= 0) || (what === 1 && s <= 0) || (what === 2 && s !== 0)) return null;
    return {
      question: `${a[i]} + ${a[l]} + ${a[r]} = ${s}. What happens next?`,
      options: [`The left pointer steps up (${a[l]} → bigger)`, `The right pointer steps down (${a[r]} → smaller)`, `Record the triplet ${show([a[i], a[l], a[r]])}`],
      answer: what,
      explain: what === 2 ? 'The three numbers add up to exactly 0, so they are a triplet.' : what === 0 ? `${s} is below 0 and the row is sorted: only a bigger left number can raise the sum.` : `${s} is above 0: only a smaller right number can lower the sum.`,
    };
  },
  bugs: [
    {
      label: 'Skip duplicates by looking ahead (i + 1)',
      find: 'nums[i] === nums[i - 1]',
      replace: 'nums[i] === nums[i + 1]',
      explain: 'The first -1 of [-1, -1, 2] is skipped because the next one is equal, so the triplet that needs both -1s is lost.',
    },
    {
      label: 'Default sort(): numbers sorted as text',
      find: '.sort((a, b) => a - b)',
      replace: '.sort()',
      explain: 'Without a comparator -1 sorts before -10 and 10 before 5, so the row is not really sorted and the pinch moves the wrong way.',
    },
  ],
};
