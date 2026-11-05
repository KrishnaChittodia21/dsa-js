// Squares of a Sorted Array (two ends inward). The biggest square always sits at one of the two ends (a big negative
// on the left or a big positive on the right), so fill the output from the back. Works with l/r, left/right, i/j.
import { changedIdx, options, row } from './util.js';

const PAIRS = [
  ['l', 'r'],
  ['left', 'right'],
  ['lo', 'hi'],
  ['i', 'j'],
  ['start', 'end'],
  ['a', 'b'],
];
const pairOf = (vars) => PAIRS.find(([x, y]) => Number.isInteger(vars[x]) && Number.isInteger(vars[y]));
// the output: a plain array that is not the input
const outOf = (vars, inName) => Object.entries(vars).find(([k, v]) => k !== inName && row(v));
const sq = (x) => x * x;

export default {
  id: 'squares-of-a-sorted-array',
  metaphor: 'Two ends race for the biggest square',
  caption: 'Squaring makes big negatives big, so the largest square is always at the left or the right end. Compare the two ends, put the bigger square at the back of the output, and move that end inward.',
  pointers: PAIRS.flat(),
  range: PAIRS,
  narrate(ctx) {
    const name = ctx.params[0];
    const a = row(ctx.vars[name]);
    const o = outOf(ctx.vars, name);
    if (!a || !o) return null;
    const [oName, out] = o;
    const was = row(ctx.prev[oName]);
    const p = pairOf(ctx.prev);
    if (!was || was.length !== out.length) return null;
    const d = changedIdx(out, was);
    if (d.length !== 1) return null;
    const s = d[0];
    const v = out[s];
    if (!p) return `${oName}[${s}] = ${v}`;
    const [l, r] = [ctx.prev[p[0]], ctx.prev[p[1]]];
    const x = a[l];
    const y = a[r];
    if (x === undefined || y === undefined) return null;
    if (l === r) return `one number left, ${x}: its square ${v} fills slot ${s}`;
    const p2 = (t) => (t < 0 ? `(${t})²` : `${t}²`);
    if (sq(x) === sq(y) && (v === sq(x))) return `a tie: ${p2(x)} = ${p2(y)} = ${v}, one of them goes into slot ${s} (the other comes next)`;
    if (v === sq(y) && sq(y) > sq(x)) return `right end ${y} beats left end ${x}: ${p2(y)} = ${v} goes into slot ${s}`;
    if (v === sq(x)) return `left end ${x} beats right end ${y}: ${p2(x)} = ${v} goes into slot ${s}`;
    return null;
  },
  // before a write: which square goes into the back of the output?
  predict(ctx) {
    if (!ctx.next) return null;
    const name = ctx.params[0];
    const a = row(ctx.vars[name]);
    const o = outOf(ctx.vars, name);
    const p = pairOf(ctx.vars);
    if (!a || !o || !p) return null;
    const [oName, out] = o;
    const after = row(ctx.next.vars[oName]);
    if (!after || after.length !== out.length) return null;
    const d = changedIdx(after, out);
    const [l, r] = [ctx.vars[p[0]], ctx.vars[p[1]]];
    if (d.length !== 1 || l >= r || a[l] === undefined || a[r] === undefined) return null;
    const v = after[d[0]];
    const [x, y] = [a[l], a[r]];
    if (sq(x) === sq(y) || (v !== sq(x) && v !== sq(y))) return null;
    const mids = a.slice(l + 1, r).map(sq);
    return options(
      `The ends are ${x} (left) and ${y} (right). Which square goes into ${oName}[${d[0]}]?`,
      v,
      [sq(x), sq(y), ...mids].filter((t) => t !== v),
      `${Math.abs(v === sq(x) ? x : y)} is the bigger size of the two ends, so ${v} is the largest square left.`,
    );
  },
  bugs: [
    {
      label: 'Compare values instead of sizes',
      find: 'Math.abs(nums[l]) > Math.abs(nums[r])',
      replace: 'nums[l] > nums[r]',
      explain: 'A negative on the left is never "bigger" than the right end, so a large negative like -4 loses to 3 even though 16 > 9.',
    },
    {
      label: 'Stop before the first slot',
      find: 'w >= 0',
      replace: 'w > 0',
      explain: 'The loop ends before slot 0 is written, so the smallest square is missing (a single number gives [undefined]).',
    },
  ],
};
