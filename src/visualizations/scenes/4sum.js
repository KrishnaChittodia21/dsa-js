// 4Sum (sort + fix two + two pointers). Fix the first two numbers, then pinch the rest of the sorted row for the
// amount still needed: too small → the left pointer steps up, too big → the right steps down. Works with i/j (or
// a/b, p/q) fixed, l/r, left/right, lo/hi pointers, a sorted copy under any name, and result/res/ans.
import { row, sorted } from './util.js';

const PAIRS = [
  ['l', 'r'],
  ['left', 'right'],
  ['lo', 'hi'],
  ['start', 'end'],
  ['k', 'm'],
];
const FIXED = [
  ['i', 'j'],
  ['a', 'b'],
  ['p', 'q'],
  ['first', 'second'],
  ['x', 'y'],
];
const OUT = ['result', 'res', 'ans', 'answer', 'out', 'output', 'quads', 'quadruplets', 'list'];

const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
const fixedOf = (vars) => FIXED.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
// the sorted row: the input once sorted, or a sorted copy under any name
function rowOf(vars, pName) {
  const p = row(vars[pName]);
  if (!p) return null;
  if (sorted(p)) return p;
  return Object.values(vars).find((v) => row(v) && v.length === p.length && sorted(v)) || null;
}
const outOf = (vars) => OUT.find((n) => Array.isArray(vars[n]) && vars[n].every((t) => row(t)));
const par = (x) => (x < 0 ? `(${x})` : x);
const show = (t) => `[${t.join(', ')}]`;

function stateOf(ctx) {
  const [pName, tName] = ctx.params;
  const a = rowOf(ctx.vars, pName);
  const t = ctx.vars[tName];
  const fx = fixedOf(ctx.vars);
  if (!a || !fx || !Number.isFinite(t)) return null;
  const [iName, jName] = fx;
  const i = ctx.vars[iName];
  const j = ctx.vars[jName];
  if (!(i >= 0 && i < j && j < a.length)) return null;
  return { a, t, i, j, iName, jName, need: t - a[i] - a[j], pair: pairOf(ctx.vars) };
}

export default {
  id: '4sum',
  metaphor: 'Fix two, pinch the other two',
  caption: 'The row is sorted. Two numbers are fixed; the bracket over the rest pinches in for what is still needed: too little steps the left end up, too much steps the right end down.',
  range: PAIRS,
  pointers: [...PAIRS.flat(), 'i', 'j'],
  compare: 'result',
  narrate(ctx) {
    const st = stateOf(ctx);
    if (!st) return null;
    const { a, t, i, j, iName, jName, need, pair } = st;
    const oName = outOf(ctx.vars);
    const out = oName && ctx.vars[oName];
    const was = oName && ctx.prev[oName];
    if (out && Array.isArray(was) && out.length === was.length + 1) {
      const q = out[out.length - 1];
      return `found ${show(q)}: ${q.join(' + ')} = ${t} · ${out.length} quadruplet${out.length > 1 ? 's' : ''} so far`;
    }
    if (i !== ctx.prev[iName] || j !== ctx.prev[jName]) {
      if (i !== ctx.prev[iName] && i > 0 && a[i] === a[i - 1]) return `${a[i]} again as the first number: its quadruplets were already found, skip it`;
      if (j > i + 1 && a[j] === a[j - 1]) return `${a[j]} again as the second number (after ${a[i]}): skip it`;
      return `fix ${a[i]} and ${a[j]}: the other two must add up to ${t} − ${par(a[i])} − ${par(a[j])} = ${need}`;
    }
    if (!pair) return null;
    const [lName, rName] = pair;
    const l = ctx.vars[lName];
    const r = ctx.vars[rName];
    const pl = ctx.prev[lName];
    const pr = ctx.prev[rName];
    const met = l >= r ? ` · the pointers met: done with ${a[i]}, ${a[j]}` : '';
    if (l === j + 1 && r === a.length - 1 && (pl !== l || pr !== r)) return `pinch the rest: ${a[l]} on the left, ${a[r]} on the right`;
    const sName = Object.keys(ctx.vars).find((n) => /sum|total|^s$|cur/i.test(n) && Number.isFinite(ctx.vars[n]));
    if (sName && Number.isInteger(pl) && Number.isInteger(pr) && a[pl] !== undefined && a[pr] !== undefined) {
      // the move reason: a stored sum is either the pair or all four (or still a hit while stepping past it)
      const v = ctx.vars[sName];
      const gap = v === a[pl] + a[pr] ? v - need : v === need ? 0 : v === a[i] + a[j] + a[pl] + a[pr] ? v - t : v === t ? 0 : null;
      if (l === pl + 1 && r === pr && gap !== null) {
        if (gap < 0) return `${a[pl]} + ${a[pr]} = ${a[pl] + a[pr]} is less than ${need}: the left pointer steps up${met || ` to ${a[l]}`}`;
        if (gap === 0) return `the left pointer moves on${a[l] === a[pl] ? `: ${a[l]} again, a duplicate, keep going` : ` to ${a[l]}`}${met}`;
      }
      if (r === pr - 1 && l === pl && gap !== null) {
        if (gap > 0) return `${a[pl]} + ${a[pr]} = ${a[pl] + a[pr]} is more than ${need}: the right pointer steps down${met || ` to ${a[r]}`}`;
        if (gap === 0) return `the right pointer moves on${a[r] === a[pr] ? `: ${a[r]} again, a duplicate, keep going` : ` to ${a[r]}`}${met}`;
      }
    }
    // the step that adds the pair up (no verdict: that is the question)
    if (sName && l < r && a[r] !== undefined && new RegExp(`\\b${sName}\\s*=[^=]`).test(ctx.lines[ctx.line - 1] || '')) return `${a[l]} + ${a[r]} = ${a[l] + a[r]}, still needed: ${need}`;
    return null;
  },
  // the first pair for each fixed two: which way does the pinch go?
  predict(ctx) {
    const st = stateOf(ctx);
    if (!st || !st.pair || !ctx.next) return null;
    const { a, i, j, iName, jName, need, pair } = st;
    const [lName, rName] = pair;
    const l = ctx.vars[lName];
    const r = ctx.vars[rName];
    if (l !== j + 1 || r !== a.length - 1 || l >= r || ctx.prev[lName] !== l || ctx.prev[rName] !== r || ctx.prev[iName] !== i || ctx.prev[jName] !== j) return null;
    const nx = ctx.next.vars;
    const oName = outOf(ctx.vars);
    const grew = oName && Array.isArray(nx[oName]) && nx[oName].length === ctx.vars[oName].length + 1;
    const s = a[l] + a[r];
    const what = grew ? 2 : nx[lName] === l + 1 && nx[rName] === r ? 0 : nx[rName] === r - 1 && nx[lName] === l ? 1 : null;
    if (what === null || (what === 0 && s >= need) || (what === 1 && s <= need) || (what === 2 && s !== need)) return null;
    return {
      question: `${a[i]} and ${a[j]} are fixed, so ${need} is still needed. The pair is ${a[l]} + ${a[r]} = ${s}. What happens next?`,
      options: [`The left pointer steps up (${a[l]} → bigger)`, `The right pointer steps down (${a[r]} → smaller)`, `Record ${show([a[i], a[j], a[l], a[r]])}`],
      answer: what,
      explain: what === 2 ? `${a[l]} + ${a[r]} is exactly the ${need} still needed, so the four numbers are a quadruplet.` : what === 0 ? `${s} is less than ${need} and the row is sorted: only a bigger left number can raise it.` : `${s} is more than ${need}: only a smaller right number can lower it.`,
    };
  },
  bugs: [
    {
      label: 'Skip second-number duplicates from j > 0',
      find: 'j > i + 1 && a[j] === a[j - 1]',
      replace: 'j > 0 && a[j] === a[j - 1]',
      explain: 'The second number is skipped whenever it equals the first, so quadruplets that reuse a value, like [2, 2, 2, 2], are lost.',
    },
    {
      label: 'Reuse the 3Sum target: need = -a[i] - a[j]',
      find: 'const need = target - a[i] - a[j];',
      replace: 'const need = -a[i] - a[j];',
      explain: 'The pair is pinched toward 0 − the two fixed numbers instead of target − them, so with a target other than 0 the wrong quadruplets are found.',
    },
  ],
};
